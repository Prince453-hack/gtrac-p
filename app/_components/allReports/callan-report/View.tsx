"use client";
import { RootState } from "@/app/_globalRedux/store";
import {
  CarOutlined,
  LoadingOutlined,
  SearchOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

import {
  Alert,
  Button,
  Drawer,
  Input,
  Pagination,
  Spin,
  Table,
  Tag,
} from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const View = () => {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredVehicles, setFilteredVehicles] = useState<any[]>([]);

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [vehicleChallans, setVehicleChallans] = useState<any[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const [totalVehicles, setTotalVehicles] = useState<number>(0);

  // Dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownList, setDropdownList] = useState<any[]>([]);
  const [selectedFromDropdown, setSelectedFromDropdown] = useState(false);

  const allVehicles = useSelector((state: RootState) => state.allVehicles);
  const { userId } = useSelector((state: RootState) => state.auth);

  const fetchVehicles = async (page = 1, limit = pageSize) => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors

      // Ensure userId is available
      if (!userId) {
        throw new Error("User ID is not available. Please log in again.");
      }

      const apiKey =
        Number(userId) === 81707
          ? process.env.NEXT_PUBLIC_CHALLAN_API_HEADER
          : process.env.NEXT_PUBLIC_CHALLAN_CARAVAN;

      if (!apiKey) {
        throw new Error("API key is not configured");
      }

      // Use proxy API to avoid CORS issues
      const url = `/api/challan/vehicles?page=${page}&limit=${limit}&userId=${userId}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        let errorText;
        try {
          errorText = await res.text();
        } catch (parseError) {
          errorText = `Failed to parse error response`;
        }
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();

      // Handle different response structures
      let vehiclesList = [];

      if (data.vehicles && Array.isArray(data.vehicles)) {
        vehiclesList = data.vehicles;
      } else if (data.challans && Array.isArray(data.challans)) {
        vehiclesList = data.challans;
      } else {
        throw new Error("Unexpected API response structure");
      }

      if (vehiclesList.length > 0) {
        const seen = new Set();
        const uniqueVehicles = vehiclesList
          .filter((item: any) => {
            const vrn = item.VRN || item.vrn || item.vehicleNumber;
            if (!vrn || seen.has(vrn)) return false;
            seen.add(vrn);
            return true;
          })
          .map((item: any) => ({
            // Normalize the data structure for consistent access
            VRN: item.VRN || item.vrn || item.vehicleNumber,
            challan_date_time: item.challan_date_time || item.lastUpdated,
            challan_place: item.challan_place || item.registeredAt,
            challan_data: item.challan_data || {
              department: item.department || "Transport",
              fine_imposed: item.fine_imposed || item.pendingChallanAmount || 0,
            },
            total_pending_amount:
              item.total_pending_amount || item.pendingChallanAmount || 0,
            // Keep original data
            ...item,
          }));

        setVehicles(uniqueVehicles);
        setTotalVehicles(
          data.pagination?.totalVehicles || vehiclesList.length || 10000
        );
      } else {
        setError("No vehicle data found in response");
      }
    } catch (err: any) {
      // Check for CORS error
      if (
        err.message.includes("CORS") ||
        err.message.includes("Access-Control-Allow-Origin")
      ) {
        setError(
          "CORS Error: The API server is not allowing requests from this domain. This works in Postman but not in browsers due to CORS policy."
        );
      } else if (
        err.name === "TypeError" &&
        err.message.includes("Failed to fetch")
      ) {
        setError(
          "Network Error: This is likely a CORS issue. The API works in Postman but browsers block cross-origin requests."
        );
      } else {
        setError(err.message || "Failed to fetch vehicles");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleChallans = async (vrn: string) => {
    try {
      setDrawerLoading(true);
      setError(null); // Clear previous errors

      if (!userId) {
        throw new Error("User ID is not available");
      }

      // Use proxy API to avoid CORS issues
      const url = `/api/challan/vehicle-details?vrn=${vrn}&userId=${userId}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        let errorText;
        try {
          errorText = await res.text();
        } catch (parseError) {
          errorText = `Failed to parse error response`;
        }
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();

      const list = Array.isArray(data) ? data : [];

      setVehicleChallans(list);
    } catch (err: any) {
      setError(err.message || "Failed to fetch vehicle challans");
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors

      const vehicleNo = searchTerm.trim();
      if (!vehicleNo) {
        setError("Please enter a vehicle number");
        return;
      }

      if (!userId) {
        throw new Error("User ID is not available");
      }

      // Use the existing vehicle-details proxy API
      const url = `/api/challan/vehicle-details?vrn=${vehicleNo}&userId=${userId}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        let errorText;
        try {
          errorText = await res.text();
        } catch (parseError) {
          errorText = `Failed to parse error response`;
        }
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      if (list.length > 0) {
        // Create a vehicle summary from the first challan
        const firstChallan = list[0];
        const vehicleSummary = {
          VRN: firstChallan.VRN || firstChallan.rc_no,
          challan_date_time: firstChallan.challan_date_time,
          challan_place: firstChallan.challan_place,
          challan_data: {
            department: firstChallan.department,
            fine_imposed: firstChallan.fine_imposed,
          },
          total_pending_amount: list.reduce(
            (sum, c) => sum + (Number(c.fine_imposed) || 0),
            0
          ),
        };

        setFilteredVehicles([vehicleSummary]);
      } else {
        setFilteredVehicles([]);
        setError("No challans found for this vehicle");
      }
    } catch (err: any) {
      setError(err.message || "Failed to search vehicle");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredVehicles([]);
      setCurrentPage(1);
      if (userId) {
        fetchVehicles(1, pageSize);
      }
    }
  }, [searchTerm, userId]);

  useEffect(() => {
    if (userId && !filteredVehicles.length) {
      fetchVehicles(currentPage, pageSize);
    } else if (!userId) {
      setError(
        "User ID is not available. Please refresh the page or log in again."
      );
    }
  }, [currentPage, pageSize, userId]);

  const handleVehicleClick = (vrn: string) => {
    setSelectedVehicle(vrn);
    setDrawerVisible(true);
    fetchVehicleChallans(vrn);
  };

  const handleExportChallans = () => {
    if (vehicleChallans.length === 0) {
      setError("No data to export");
      return;
    }

    // Prepare CSV data
    const headers = [
      "Challan No",
      "Date",
      "Place",
      "State",
      "Offence",
      "Fine Imposed",
      "Status",
      "Department",
    ];

    const rows = vehicleChallans.map((challan) => [
      challan.challan_no || "N/A",
      challan.challan_date_time
        ? new Date(challan.challan_date_time).toLocaleDateString('en-GB')
        : "N/A",
      challan.challan_place || "N/A",
      challan.state_code || "N/A",
      challan.offence_details?.map((o: any) => o.name).join("; ") || "N/A",
      challan.fine_imposed || 0,
      challan.challan_status || "N/A",
      challan.department || "N/A",
    ]);

    // Calculate totals
    const totalAmount = vehicleChallans.reduce(
      (sum, c) => sum + (Number(c.fine_imposed) || 0),
      0
    );
    const pendingAmount = vehicleChallans
      .filter((c) => c.challan_status === "Pending")
      .reduce((sum, c) => sum + (Number(c.fine_imposed) || 0), 0);
    const disposedAmount = totalAmount - pendingAmount;

    // Add summary rows
    rows.push([]);
    rows.push(["Summary"]);
    rows.push(["Total Amount", totalAmount.toLocaleString()]);
    rows.push(["Total Pending", pendingAmount.toLocaleString()]);
    rows.push(["Total Disposed", disposedAmount.toLocaleString()]);

    // Create CSV content with UTF-8 BOM for proper Excel encoding
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const cellStr = String(cell || "");
            // Escape quotes and wrap in quotes if contains comma or special chars
            return cellStr.includes(",") || cellStr.includes('"')
              ? `"${cellStr.replace(/"/g, '""')}"`
              : cellStr;
          })
          .join(",")
      ),
    ].join("\n");

    // Add UTF-8 BOM for proper Excel encoding
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedVehicle}_challans_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportPendingChallans = () => {
    const pendingChallans = vehicleChallans.filter(
      (c) => c.challan_status === "Pending"
    );
    if (pendingChallans.length === 0) {
      setError("No pending challans to export");
      return;
    }

    const headers = [
      "Challan No",
      "Date",
      "Place",
      "State",
      "Offence",
      "Fine Imposed",
      "Status",
      "Department",
    ];

    const rows = pendingChallans.map((challan) => [
      challan.challan_no || "N/A",
      challan.challan_date_time
        ? new Date(challan.challan_date_time).toLocaleDateString('en-GB')
        : "N/A",
      challan.challan_place || "N/A",
      challan.state_code || "N/A",
      challan.offence_details?.map((o: any) => o.name).join("; ") || "N/A",
      challan.fine_imposed || 0,
      challan.challan_status || "N/A",
      challan.department || "N/A",
    ]);

    const totalAmount = pendingChallans.reduce(
      (sum, c) => sum + (Number(c.fine_imposed) || 0),
      0
    );

    rows.push([]);
    rows.push(["Summary"]);
    rows.push(["Total Pending Amount", totalAmount.toLocaleString()]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const cellStr = String(cell || "");
            return cellStr.includes(",") || cellStr.includes('"')
              ? `"${cellStr.replace(/"/g, '""')}"`
              : cellStr;
          })
          .join(",")
      ),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedVehicle}_pending_challans_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportDisposedChallans = () => {
    const disposedChallans = vehicleChallans.filter(
      (c) => c.challan_status !== "Pending"
    );
    if (disposedChallans.length === 0) {
      setError("No disposed challans to export");
      return;
    }

    const headers = [
      "Challan No",
      "Date",
      "Place",
      "State",
      "Offence",
      "Fine Imposed",
      "Status",
      "Department",
    ];

    const rows = disposedChallans.map((challan) => [
      challan.challan_no || "N/A",
      challan.challan_date_time
        ? new Date(challan.challan_date_time).toLocaleDateString('en-GB')
        : "N/A",
      challan.challan_place || "N/A",
      challan.state_code || "N/A",
      challan.offence_details?.map((o: any) => o.name).join("; ") || "N/A",
      challan.fine_imposed || 0,
      challan.challan_status || "N/A",
      challan.department || "N/A",
    ]);

    const totalAmount = disposedChallans.reduce(
      (sum, c) => sum + (Number(c.fine_imposed) || 0),
      0
    );

    rows.push([]);
    rows.push(["Summary"]);
    rows.push(["Total Disposed Amount", totalAmount.toLocaleString()]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const cellStr = String(cell || "");
            return cellStr.includes(",") || cellStr.includes('"')
              ? `"${cellStr.replace(/"/g, '""')}"`
              : cellStr;
          })
          .join(",")
      ),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedVehicle}_disposed_challans_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExportAllVehiclesChallans = async () => {
    if (totalVehicles === 0) {
      setError("No vehicle data to export");
      return;
    }

    try {
      setLoading(true);
      const allChallans: any[] = [];
      let globalTotalAmount = 0;
      let globalPendingAmount = 0;

      // Calculate total pages needed
      const totalPages = Math.ceil(totalVehicles / pageSize);
      const allVehiclesData: any[] = [];

      // Fetch all vehicles from all pages
      for (let page = 1; page <= totalPages; page++) {
        try {
          const url = `/api/challan/vehicles?page=${page}&limit=${pageSize}&userId=${userId}`;
          const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });

          if (res.ok) {
            const data = await res.json();
            let vehiclesList = [];

            if (data.vehicles && Array.isArray(data.vehicles)) {
              vehiclesList = data.vehicles;
            } else if (data.challans && Array.isArray(data.challans)) {
              vehiclesList = data.challans;
            }

            allVehiclesData.push(...vehiclesList);
          }
        } catch (err) {
          console.error(`Error fetching vehicles page ${page}:`, err);
        }
      }

      // Remove duplicates from all vehicles
      const seen = new Set();
      const uniqueVehicles = allVehiclesData.filter((item: any) => {
        const vrn = item.VRN || item.vrn || item.vehicleNumber;
        if (!vrn || seen.has(vrn)) return false;
        seen.add(vrn);
        return true;
      });

      // Fetch challans for each vehicle
      for (const vehicle of uniqueVehicles) {
        const vrn = vehicle.VRN || vehicle.vrn || vehicle.vehicleNumber;

        try {
          const url = `/api/challan/vehicle-details?vrn=${vrn}&userId=${userId}`;
          const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });

          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];

            list.forEach((challan: any) => {
              allChallans.push({
                ...challan,
                vehicle_number: vrn,
              });
              globalTotalAmount += Number(challan.fine_imposed) || 0;
              if (challan.challan_status === "Pending") {
                globalPendingAmount += Number(challan.fine_imposed) || 0;
              }
            });
          }
        } catch (err) {
          console.error(`Error fetching challans for ${vrn}:`, err);
        }
      }

      if (allChallans.length === 0) {
        setError("No challan data found for any vehicle");
        return;
      }

      // Prepare CSV with Vehicle Number as first column
      const headers = [
        "Vehicle Number",
        "Challan No",
        "Date",
        "Place",
        "State",
        "Offence",
        "Fine Imposed",
        "Status",
        "Department",
      ];

      const rows = allChallans.map((challan) => [
        challan.vehicle_number || "N/A",
        challan.challan_no || "N/A",
        challan.challan_date_time
          ? new Date(challan.challan_date_time).toLocaleDateString('en-GB')
          : "N/A",
        challan.challan_place || "N/A",
        challan.state_code || "N/A",
        challan.offence_details?.map((o: any) => o.name).join("; ") || "N/A",
        challan.fine_imposed || 0,
        challan.challan_status || "N/A",
        challan.department || "N/A",
      ]);

      const globalDisposedAmount = globalTotalAmount - globalPendingAmount;

      // Add summary section
      rows.push([]);
      rows.push(["SUMMARY REPORT"]);
      rows.push([]);
      rows.push(["Total Amount", globalTotalAmount.toLocaleString()]);
      rows.push(["Total Pending Amount", globalPendingAmount.toLocaleString()]);
      rows.push([
        "Total Disposed Amount",
        globalDisposedAmount.toLocaleString(),
      ]);
      rows.push([]);
      rows.push(["Total Challans", allChallans.length.toString()]);
      rows.push([
        "Pending Challans",
        allChallans
          .filter((c) => c.challan_status === "Pending")
          .length.toString(),
      ]);
      rows.push([
        "Disposed Challans",
        allChallans
          .filter((c) => c.challan_status !== "Pending")
          .length.toString(),
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) => {
              const cellStr = String(cell || "");
              return cellStr.includes(",") || cellStr.includes('"')
                ? `"${cellStr.replace(/"/g, '""')}"`
                : cellStr;
            })
            .join(",")
        ),
      ].join("\n");

      // Add UTF-8 BOM for proper Excel encoding
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `all_vehicles_challans_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to export all vehicles challans");
    } finally {
      setLoading(false);
    }
  };

  const vehicleColumns = [
    {
      title: "S.No",
      key: "sno",
      render: (_: any, __: any, index: number) => index + 1,
      width: 70,
    },

    // ------------------- VEHICLE NO -------------------
    {
      title: "Vehicle No",
      key: "VRN",
      dataIndex: "VRN",
      render: (_: any, record: any) => {
        const vehicleNumber = record.VRN || record.vrn || record.vehicleNumber;
        return (
          <Tag
            color="blue"
            icon={<CarOutlined />}
            onClick={() => handleVehicleClick(vehicleNumber)}
            style={{ cursor: "pointer", fontSize: 14, padding: "4px 8px" }}
          >
            {vehicleNumber}
          </Tag>
        );
      },
    },

    // ------------------- LAST DATE -------------------
    {
      title: "Last Date",
      key: "challan_date_time",
      render: (record: any) => {
        const date =
          record.challan_date_time || record.lastUpdated || record.updatedAt;
        if (!date) return "N/A";
        try {
          return new Date(date).toLocaleDateString();
        } catch {
          return date.split(" ")[0] || "N/A";
        }
      },
    },

    // ------------------- PLACE -------------------
    {
      title: "Place",
      key: "challan_place",
      render: (record: any) => {
        const place = record.challan_place || record.registeredAt || "N/A";
        return place;
      },
    },

    // ------------------- DEPARTMENT (INSIDE challan_data) -------------------
    {
      title: "Department",
      key: "department",
      render: (record: any) => {
        const dep =
          record.challan_data?.department || record.department || "Transport";
        return <Tag color="green">{dep}</Tag>;
      },
    },
  ];

  return (
    <div className="p-4 overflow-y-auto">
      <h1 className="text-2xl font-semibold mb-4 flex items-center gap-2">
        <CarOutlined /> Vehicle Challan Dashboard
      </h1>

      <div style={{ display: "flex", gap: "10px", marginBottom: 16 }}>
        <div style={{ position: "relative", width: 300 }}>
          <Input
            placeholder="Search Vehicle No..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => {
              const val = e.target.value;
              setSearchTerm(val);
              setSelectedFromDropdown(false);

              if (!val.trim()) {
                setShowDropdown(false);
                return;
              }

              const filtered = allVehicles
                ?.filter((v: any) =>
                  v.veh_reg.toLowerCase().includes(val.toLowerCase())
                )
                ?.slice(0, 8);

              setDropdownList(filtered);
              setShowDropdown(true);
            }}
            allowClear
          />

          {/* DROPDOWN */}
          {showDropdown && dropdownList.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 42,
                left: 0,
                width: "100%",
                background: "white",
                border: "1px solid #d9d9d9",
                borderRadius: 6,
                zIndex: 1000,
                maxHeight: 200,
                overflowY: "auto",
                boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
              }}
            >
              {dropdownList.map((item: any, i: number) => (
                <div
                  key={i}
                  onClick={() => {
                    setSearchTerm(item.veh_reg);
                    setSelectedFromDropdown(true);
                    setShowDropdown(false);
                  }}
                  style={{
                    padding: "8px 10px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  {item.veh_reg}
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={() => {
            if (!selectedFromDropdown) return; // prevents wrong hits
            handleSearch();
          }}
        >
          Search
        </Button>

        <Button
          type="default"
          icon={<DownloadOutlined />}
          onClick={handleExportAllVehiclesChallans}
          loading={loading}
          style={{
            borderColor: "#52c41a",
            color: "#52c41a",
          }}
        >
          Export All Vehicles
        </Button>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spin
            size="large"
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
          />
        </div>
      ) : (
        <>
          <div
            style={{
              overflowX: "auto",
              maxHeight: "450px",
              minHeight: "450px",
            }}
          >
            <Table
              columns={vehicleColumns}
              dataSource={
                filteredVehicles.length > 0 ? filteredVehicles : vehicles
              }
              rowKey={(record) =>
                record.VRN || record.vrn || record.id || Math.random()
              }
              pagination={false}
              bordered
              size="middle"
              sticky
              scroll={{ y: 400 }}
              rowClassName={() => "hover:bg-gray-100 cursor-pointer"}
            />
          </div>

          <div className="flex justify-center mt-4">
            <Pagination
              size="small"
              current={currentPage}
              total={totalVehicles}
              pageSize={pageSize}
              showSizeChanger
              showQuickJumper
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
            />
          </div>
        </>
      )}

      <Drawer
        title={
          <div className="flex justify-between items-center w-full">
            <span>Challan for {selectedVehicle}</span>
            <Button
              type="primary"
              size="small"
              onClick={handleExportChallans}
              className="mr-2"
            >
              Export
            </Button>
          </div>
        }
        placement="right"
        width={950}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {drawerLoading ? (
          <Spin indicator={<LoadingOutlined spin />} />
        ) : (
          <>
            {/* Summary Cards */}
            <div
              style={{
                display: "flex",
                gap: "16px",
                marginBottom: "20px",
                flexWrap: "wrap",
              }}
            >
              {(() => {
                const total = vehicleChallans.length;
                const pending = vehicleChallans.filter(
                  (c) => c.challan_status === "Pending"
                ).length;
                const disposed = total - pending;

                const totalAmount = vehicleChallans.reduce(
                  (sum, c) => sum + (Number(c.fine_imposed) || 0),
                  0
                );
                const pendingAmount = vehicleChallans
                  .filter((c) => c.challan_status === "Pending")
                  .reduce((sum, c) => sum + (Number(c.fine_imposed) || 0), 0);
                const disposedAmount = totalAmount - pendingAmount;

                return (
                  <>
                    {/* Total */}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 280,
                        background: "#f3f4f6",
                        borderRadius: 12,
                        padding: "20px",
                        color: "#374151",
                        textAlign: "center",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                        border: "1px solid #667eea",
                        position: "relative",
                      }}
                    >
                      <button
                        onClick={handleExportChallans}
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 18,
                          color: "#667eea",
                        }}
                        title="Export Total Challans"
                      >
                        <DownloadOutlined />
                      </button>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: "600",
                          marginBottom: 12,
                          color: "#667eea",
                        }}
                      >
                        Total Challans
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: "bold",
                          color: "#1f2937",
                        }}
                      >
                        ₹ {totalAmount.toLocaleString()}
                      </div>
                    </div>

                    {/* Pending */}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 280,
                        background: "#fef2f2",
                        borderRadius: 12,
                        padding: "20px",
                        color: "#374151",
                        textAlign: "center",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                        border: "1px solid #f5576c",
                        position: "relative",
                      }}
                    >
                      <button
                        onClick={exportPendingChallans}
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 18,
                          color: "#f5576c",
                        }}
                        title="Export Pending Challans"
                      >
                        <DownloadOutlined />
                      </button>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: "600",
                          marginBottom: 12,
                          color: "#f5576c",
                        }}
                      >
                        Pending
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: "bold",
                          color: "#1f2937",
                        }}
                      >
                        ₹ {pendingAmount.toLocaleString()}
                      </div>
                    </div>

                    {/* Disposed */}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 280,
                        background: "#f0f9ff",
                        borderRadius: 12,
                        padding: "20px",
                        color: "#374151",
                        textAlign: "center",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                        border: "1px solid #4facfe",
                        position: "relative",
                      }}
                    >
                      <button
                        onClick={exportDisposedChallans}
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 18,
                          color: "#4facfe",
                        }}
                        title="Export Disposed Challans"
                      >
                        <DownloadOutlined />
                      </button>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: "600",
                          marginBottom: 12,
                          color: "#4facfe",
                        }}
                      >
                        Disposed
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: "bold",
                          color: "#1f2937",
                        }}
                      >
                        ₹ {disposedAmount.toLocaleString()}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Challans Table */}
            <Table
              dataSource={vehicleChallans}
              rowKey="challan_no"
              pagination={false}
              bordered
              size="small"
              columns={[
                { title: "Challan No", dataIndex: "challan_no" },

                {
                  title: "Date",
                  dataIndex: "challan_date_time",
                  width: 100,
                  render: (date) => {
                    if (!date) return "N/A";
                    try {
                      return new Date(date).toLocaleDateString();
                    } catch {
                      return date.split("T")[0] || "N/A";
                    }
                  },
                },

                {
                  title: "Place",
                  dataIndex: "challan_place",
                  render: (place) => place || "N/A",
                },

                {
                  title: "State",
                  dataIndex: "state_code",
                  render: (state) => <Tag color="blue">{state || "N/A"}</Tag>,
                },

                {
                  title: "Offence",
                  key: "offence_names",
                  width: 250,
                  render: (record) => (
                    <div
                      style={{
                        background: "#f7f9fc",
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 13,
                        color: "#374151",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <ul style={{ paddingLeft: 18, margin: 0 }}>
                        {record?.offence_details?.map(
                          (o: { name: string; act?: string }, i: number) => (
                            <li
                              key={i}
                              style={{
                                marginBottom: 4,
                                paddingBottom: 2,
                                listStyleType: "disc",
                              }}
                            >
                              {o?.name || "N/A"}
                              {o?.act && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#6b7280",
                                    marginTop: 2,
                                  }}
                                >
                                  Act: {o.act}
                                </div>
                              )}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  ),
                },

                {
                  title: "Fine Imposed",
                  dataIndex: "fine_imposed",
                  render: (amount) => <Tag color="red">₹ {amount || 0}</Tag>,
                },

                {
                  title: "Status",
                  dataIndex: "challan_status",
                  render: (status) => (
                    <Tag color={status === "Pending" ? "red" : "green"}>
                      {status || "N/A"}
                    </Tag>
                  ),
                },

                {
                  title: "Department",
                  dataIndex: "department",
                  render: (dept) => <Tag color="green">{dept || "N/A"}</Tag>,
                },
              ]}
            />
          </>
        )}
      </Drawer>
    </div>
  );
};

export default View;
