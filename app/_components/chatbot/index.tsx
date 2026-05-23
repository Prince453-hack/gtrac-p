"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { useGetVehiclesByStatusQuery } from "@/app/_globalRedux/services/trackingDashboard";
import { RootState } from "@/app/_globalRedux/store";
import type { VehicleData } from "@/app/_globalRedux/services/types/getListVehiclesmobTypes";

const orbSvg = `
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 403.3 403.3" xml:space="preserve" aria-hidden="true">
  <g id="Orb_1_">
    <circle fill="#00FFFF" cx="201.6" cy="201.6" r="109.9"/>
  </g>
  <g id="Orb">
    <radialGradient id="SVGID_1_" cx="201.6483" cy="201.6483" r="94.5055" gradientUnits="userSpaceOnUse">
      <stop offset="0" style="stop-color:#FFFFFF"/>
      <stop offset="0" style="stop-color:#F7F7F7"/>
      <stop offset="1" style="stop-color:#000000;stop-opacity:0"/>
    </radialGradient>
    <circle fill="url(#SVGID_1_)" cx="201.6" cy="201.6" r="94.5"/>
  </g>
  <g id="ring1">
    <path fill="#C5FFFD" d="M371.9,201.7c0,0,0,1-0.1,3c-0.1,2-0.4,4.9-1.2,8.6c-0.8,3.7-2.3,8.2-4.6,13.2c-2.3,5-5.5,10.5-9.4,16.4c-3.9,5.9-8.6,12.2-13.6,19.2c-2.5,3.5-5,7.1-7.4,11c-2.4,3.9-4.7,8.1-6.8,12.5c-4.3,8.9-8.1,18.6-12.8,28.7c-2.4,5-5,10.2-8.1,15.2c-3.1,5-6.8,9.9-11.4,14.2c-2.3,2.1-4.8,4.1-7.5,5.8l-1,0.6c-0.2,0.1-0.3,0.2-0.6,0.3l-0.5,0.3c-0.7,0.4-1.3,0.8-2.1,1.1c-0.7,0.4-1.5,0.7-2.2,1.1c-0.8,0.3-1.5,0.6-2.3,0.9c-6.1,2.3-12.7,3.4-19.4,3.8c-6.7,0.4-13.4,0.1-20.2-0.5c-6.8-0.6-13.6-1.3-20.5-2c-6.9-0.7-13.9-1.2-21-1.1c-7,0.1-14.2,0.7-21.5,1.3c-7.3,0.7-14.7,1.4-22.2,1.7c-7.5,0.3-15.2,0.2-22.8-1.3c-7.6-1.4-15-4.4-21.3-9.2c-6.3-4.8-11.4-10.9-15.6-17.6c-8.4-13.4-13.7-28.4-20.7-42.7c-1.8-3.6-3.6-7.1-5.7-10.5c-2.1-3.4-4.3-6.7-6.6-10c-4.6-6.5-9.6-12.9-14.3-19.5c-4.7-6.6-9.1-13.4-12.5-20.9c-3.4-7.4-5.6-15.5-5.6-23.9c-0.1-8.2,2-16.5,5.3-24c3.3-7.5,7.7-14.5,12.3-21.2c4.6-6.7,9.5-13.1,14.1-19.6c2.3-3.3,4.5-6.6,6.5-10c2-3.4,3.8-6.9,5.5-10.5c6.9-14.2,12.2-29.3,20.7-42.8c4.3-6.7,9.4-13,15.9-17.8c0.8-0.6,1.6-1.2,2.5-1.7c0.9-0.5,1.7-1.1,2.6-1.6c0.9-0.5,1.6-0.9,2.6-1.4c0.9-0.4,1.8-0.9,2.8-1.3c3.7-1.5,7.5-2.6,11.4-3.4c7.7-1.4,15.5-1.5,23-1.2c7.5,0.4,14.9,1.2,22.2,1.9c7.3,0.7,14.4,1.4,21.5,1.5l2.6,0l2.7,0c1.7,0,3.5-0.1,5.2-0.2c3.5-0.2,7-0.5,10.4-0.8c13.8-1.2,27.4-3.1,40.8-2.3c6.7,0.4,13.3,1.6,19.4,3.9c6.1,2.3,11.6,5.9,16.2,10.2c4.6,4.3,8.3,9.2,11.4,14.2c3.1,5,5.7,10.1,8.1,15.2c4.7,10.1,8.5,19.9,12.8,28.7c2.1,4.4,4.4,8.6,6.8,12.5c2.4,3.9,5,7.5,7.4,11c4.9,7,9.7,13.3,13.6,19.2c4,5.9,7.1,11.4,9.4,16.4c2.3,5,3.7,9.5,4.6,13.2c0.8,3.7,1.1,6.6,1.2,8.6C371.9,200.6,371.9,201.6,371.9,201.7L371.9,201.7z M371.5,201.6c0,0,0-1-0.1-3c-0.1-1.9-0.4-4.8-1.3-8.5c-0.9-3.7-2.3-8.2-4.6-13.1c-2.3-5-5.6-10.4-9.6-16.2c-2-2.9-4.2-5.9-6.5-9.1c-2.4-3.1-4.8-6.4-7.4-9.8c-2.6-3.4-5.2-7-7.7-10.9c-2.5-3.9-4.9-8.1-7.2-12.5c-4.5-8.8-8.6-18.6-13.5-28.4c-2.4-4.9-5.1-9.9-8.3-14.7c-3.2-4.8-6.8-9.4-11.1-13.3c-1.1-1-2.2-1.9-3.4-2.8c-0.6-0.5-1.2-0.9-1.8-1.3c-0.6-0.4-1.2-0.8-1.9-1.2c-2.6-1.6-5.3-2.9-8.1-3.9c-5.7-2.1-12-3.1-18.4-3.4c-12.8-0.6-26.3,1.2-40.2,2.6c-3.5,0.3-7,0.6-10.6,0.8c-1.8,0.1-3.6,0.2-5.4,0.2l-2.7,0l-2.7,0c-7.3-0.1-14.5-0.8-21.8-1.5c-7.3-0.7-14.6-1.5-22-1.9c-7.4-0.3-14.8-0.3-22,1c-3.6,0.7-7.2,1.6-10.6,3c-0.9,0.3-1.7,0.7-2.5,1.1c-0.8,0.3-1.7,0.9-2.5,1.3c-0.7,0.4-1.6,0.9-2.3,1.4c-0.8,0.5-1.5,1-2.3,1.6c-6,4.4-10.9,10.3-15,16.7c-8.3,13-13.7,27.9-20.8,42.3c-1.8,3.6-3.7,7.2-5.8,10.7c-2.1,3.5-4.4,6.8-6.7,10.1c-4.7,6.6-9.7,12.9-14.3,19.4c-4.7,6.5-9,13.3-12.4,20.5c-3.3,7.2-5.4,15-5.5,23c-0.1,7.9,1.9,15.8,5.1,23.1c3.2,7.3,7.5,14.2,12.1,20.8c4.6,6.6,9.5,13,14.2,19.6c2.3,3.3,4.6,6.6,6.6,10.1c2.1,3.5,3.9,7,5.7,10.6c3.5,7.2,6.6,14.5,9.9,21.7c3.3,7.2,6.8,14.2,10.9,20.8c4.2,6.5,9.2,12.5,15.3,17c6.1,4.5,13.3,7.2,20.6,8.5c7.4,1.3,14.9,1.3,22.3,0.9c7.4-0.4,14.7-1.3,22-2.1c7.3-0.8,14.5-1.5,21.8-1.7c7.2-0.2,14.4,0.3,21.3,0.9c13.9,1.2,27.3,3.1,40.2,2.4c6.4-0.3,12.7-1.4,18.4-3.5c0.7-0.3,1.4-0.6,2.1-0.8c0.7-0.3,1.4-0.6,2-0.9c0.7-0.3,1.4-0.7,2.1-1.1l0.5-0.3c0.1,0,0.3-0.2,0.4-0.3l1-0.6c2.5-1.6,4.9-3.4,7.1-5.3c4.4-4,8-8.6,11.2-13.4c3.1-4.8,5.8-9.8,8.3-14.7c4.9-9.9,8.9-19.6,13.4-28.4c2.2-4.4,4.6-8.6,7.2-12.5c2.5-3.9,5.2-7.5,7.7-10.9c2.6-3.4,5-6.7,7.4-9.8c2.3-3.1,4.5-6.2,6.5-9.1c4-5.8,7.3-11.3,9.6-16.3c2.3-5,3.8-9.4,4.6-13.1c0.8-3.7,1.1-6.6,1.3-8.5C371.5,202.7,371.5,201.6,371.5,201.6L371.5,201.6z"/>
  </g>
  <g id="ring2">
    <path fill="#C5FFFD" d="M328.4,328.7c0,0-0.8,0.7-2.3,2.2c-1.6,1.4-3.9,3.3-7.3,5.5c-3.4,2.1-7.8,4.4-13.3,6.4c-5.5,2-12,3.7-19.3,5.2c-7.3,1.4-15.6,2.6-24.4,4c-4.4,0.7-9.1,1.5-13.8,2.6c-4.7,1.1-9.5,2.5-14.4,4.2c-9.8,3.4-20,7.8-31,11.8c-5.5,2-11.3,3.8-17.3,5.2c-6,1.3-12.4,2.2-19,2c-3.3-0.1-6.6-0.5-9.8-1.3l-1.2-0.3c-0.2-0.1-0.4-0.1-0.6-0.2l-0.6-0.2c-0.8-0.2-1.6-0.4-2.4-0.7c-0.8-0.3-1.6-0.6-2.4-0.9c-0.8-0.3-1.6-0.7-2.4-1c-6.2-2.8-11.9-6.9-17.2-11.5c-5.2-4.6-10-9.9-14.6-15.4c-4.6-5.5-9.1-11.2-13.8-16.8c-4.7-5.6-9.5-11.3-14.9-16.5c-5.3-5.2-11.2-10.1-17.1-15c-5.9-4.9-12-9.9-17.8-15.2c-5.8-5.4-11.4-11.2-16-17.9c-4.5-6.7-7.9-14.4-9-22.6c-1.1-8.2-0.3-16.5,1.5-24.6c3.7-16.2,11-31.4,16.4-47.2c1.4-4,2.6-8,3.6-12.1c1-4.1,1.8-8.2,2.5-12.4c1.4-8.3,2.5-16.8,3.9-25.2c1.4-8.4,3.3-16.8,6.3-24.9c3-8,7.5-15.7,13.6-21.9c6.1-6.1,13.8-10.7,21.8-13.8c8.1-3.1,16.5-5,24.9-6.5c8.4-1.5,16.8-2.6,25.2-4c4.2-0.7,8.3-1.5,12.3-2.6c4-1,8-2.3,12-3.6c15.8-5.5,31-12.7,47.4-16.3c8.1-1.8,16.6-2.6,24.9-1.4c1,0.2,2.1,0.4,3.1,0.5c1,0.3,2,0.5,3.1,0.7c1,0.3,1.9,0.5,2.9,0.9c1,0.4,2,0.7,3,1.1c3.8,1.6,7.5,3.6,10.8,5.9c6.8,4.7,12.6,10.3,17.9,16.2c5.3,5.9,10.2,12,15.1,18c4.9,6,9.7,11.8,14.9,17.2c5.2,5.4,10.7,10.2,16.3,14.9c11.2,9.4,22.7,18.1,32,28.6c4.6,5.3,8.7,11,11.5,17.2c2.8,6.2,4.2,12.9,4.4,19.5c0.2,6.6-0.7,12.9-2,19c-1.4,6-3.3,11.8-5.3,17.3c-4,11-8.5,21.2-11.8,31c-1.7,4.9-3.1,9.7-4.2,14.4c-1.1,4.7-1.9,9.3-2.7,13.8c-1.5,8.9-2.7,17.1-4.1,24.4c-1.4,7.3-3.2,13.8-5.2,19.3c-2,5.5-4.3,9.9-6.5,13.3c-2.2,3.4-4.1,5.8-5.5,7.3C329.1,328,328.4,328.7,328.4,328.7z M328.2,328.5c0,0,0.7-0.8,2.1-2.3c1.3-1.6,3.3-3.9,5.4-7.3c2.1-3.4,4.4-7.8,6.3-13.2c2-5.4,3.7-11.9,5.1-19.2c0.7-3.7,1.3-7.5,2-11.6c0.6-4.1,1.2-8.4,1.9-12.8c0.7-4.5,1.4-9.1,2.4-13.9c1-4.8,2.4-9.7,4-14.6c3.3-9.9,7.5-20.2,11.3-31.2c1.9-5.5,3.6-11.2,4.9-17.1c1.2-5.9,2-12.1,1.7-18.4c-0.3-6.3-1.7-12.6-4.4-18.5c-2.7-5.9-6.6-11.4-11.2-16.4c-9.1-10.1-20.5-18.8-31.8-28.2c-2.8-2.4-5.7-4.8-8.4-7.3c-1.4-1.3-2.8-2.5-4.2-3.9l-2-2l-2-2c-5.3-5.5-10.2-11.4-15.1-17.4c-4.9-6-9.8-12-15-17.8c-5.2-5.8-10.8-11.3-17.3-15.8c-3.2-2.2-6.6-4.2-10.3-5.7c-0.9-0.4-1.8-0.7-2.7-1c-0.9-0.3-1.9-0.6-2.9-0.9c-0.9-0.2-1.9-0.5-2.8-0.7c-1-0.2-1.9-0.4-2.9-0.5c-7.8-1.2-15.9-0.5-23.9,1.2c-15.9,3.5-31.1,10.6-47.1,16c-4,1.3-8.1,2.6-12.2,3.6c-4.1,1-8.3,1.8-12.5,2.5c-8.4,1.4-16.8,2.4-25.2,3.8c-8.4,1.4-16.7,3.2-24.6,6.2c-7.9,3-15.3,7.2-21.3,13.2c-6,5.9-10.4,13.3-13.5,21.2c-3.1,7.9-5,16.2-6.5,24.6c-1.5,8.4-2.6,16.8-4,25.1c-0.7,4.2-1.6,8.3-2.6,12.5c-1,4.1-2.3,8.1-3.7,12.1c-2.8,8-5.9,15.7-8.8,23.5c-2.9,7.8-5.6,15.6-7.4,23.7c-1.7,8-2.5,16.2-1.3,24.2c1.2,8,4.5,15.4,9,21.9c4.5,6.5,10.1,12.1,15.9,17.4c5.8,5.2,11.9,10.1,17.9,14.9c6,4.9,11.9,9.7,17.4,15c5.5,5.3,10.4,10.9,15.1,16.6c9.4,11.3,18.1,22.7,28.2,31.8c5.1,4.6,10.5,8.5,16.4,11.2c0.7,0.3,1.5,0.6,2.2,1c0.7,0.3,1.5,0.6,2.2,0.8c0.7,0.3,1.6,0.5,2.3,0.7l0.6,0.2c0.1,0,0.4,0.1,0.6,0.1l1.2,0.3c3.1,0.7,6.3,1.1,9.4,1.3c6.3,0.3,12.5-0.5,18.4-1.7c5.9-1.3,11.6-3,17.2-4.9c11-3.8,21.3-8,31.2-11.2c5-1.6,9.9-3,14.6-4c4.8-1,9.4-1.7,13.9-2.4c4.5-0.6,8.7-1.2,12.8-1.8c4.1-0.6,8-1.2,11.6-1.9c7.3-1.4,13.8-3,19.3-5c5.5-1.9,9.9-4.2,13.3-6.3c3.4-2.1,5.8-4.1,7.3-5.4C327.4,329.3,328.2,328.5,328.2,328.5z"/>
  </g>
  <g id="ring3">
    <path fill="#C5FFFD" d="M328.7,74.9c0,0,0.7,0.8,2.2,2.3c1.4,1.6,3.3,3.9,5.5,7.3c2.1,3.4,4.4,7.8,6.4,13.3c2,5.5,3.7,12,5.2,19.3c1.4,7.3,2.6,15.6,4,24.4c0.7,4.4,1.5,9.1,2.6,13.8c1.1,4.7,2.5,9.5,4.2,14.4c3.4,9.8,7.8,20,11.8,31c2,5.5,3.8,11.3,5.2,17.3c1.3,6,2.2,12.4,2,19c-0.1,3.3-0.5,6.6-1.3,9.8l-0.3,1.2c-0.1,0.2-0.1,0.4-0.2,0.6l-0.2,0.6c-0.2,0.8-0.4,1.6-0.7,2.4c-0.3,0.8-0.6,1.6-0.9,2.4c-0.3,0.8-0.7,1.6-1,2.4c-2.8,6.2-6.9,11.9-11.5,17.2c-4.6,5.2-9.9,10-15.4,14.6c-5.5,4.6-11.2,9.1-16.8,13.8c-5.6,4.7-11.3,9.5-16.5,14.9c-5.2,5.3-10.1,11.2-15,17.1c-4.9,5.9-9.9,12-15.2,17.8c-5.4,5.8-11.2,11.4-17.9,16c-6.7,4.5-14.4,7.9-22.6,9c-8.2,1.1-16.5,0.3-24.6-1.5c-16.2-3.7-31.4-11-47.2-16.4c-4-1.4-8-2.6-12.1-3.6c-4.1-1-8.2-1.8-12.4-2.5c-8.3-1.4-16.8-2.5-25.2-3.9c-8.4-1.4-16.8-3.3-24.9-6.3c-8-3-15.7-7.5-21.9-13.6c-6.2-6.1-10.7-13.8-13.8-21.8c-3.1-8.1-5-16.5-6.5-24.9c-1.5-8.4-2.6-16.8-4-25.2c-0.7-4.2-1.5-8.3-2.6-12.3c-1-4-2.3-8-3.6-12c-5.5-15.8-12.7-31-16.3-47.4c-1.8-8.1-2.6-16.6-1.4-24.9c0.2-1,0.4-2.1,0.5-3.1c0.3-1,0.5-2,0.7-3.1c0.3-1,0.5-1.9,0.9-2.9c0.4-1,0.7-2,1.1-3c1.6-3.8,3.6-7.5,5.9-10.8c4.7-6.8,10.3-12.6,16.2-17.9c5.9-5.3,12-10.2,18-15.1c6-4.9,11.8-9.7,17.2-14.9c5.4-5.2,10.2-10.7,14.9-16.3c9.4-11.2,18.1-22.7,28.6-32c5.3-4.6,11-8.7,17.2-11.5c6.2-2.8,12.9-4.2,19.5-4.4c6.6-0.2,12.9,0.7,19,2c6,1.4,11.8,3.3,17.3,5.3c11,4,21.2,8.5,31,11.8c4.9,1.7,9.7,3.1,14.4,4.2c4.7,1.1,9.3,1.9,13.8,2.7c8.9,1.5,17.1,2.7,24.4,4.1c7.3,1.4,13.8,3.2,19.3,5.2c5.5,2,9.9,4.3,13.3,6.5c3.4,2.2,5.8,4.1,7.3,5.5C328,74.2,328.7,74.9,328.7,74.9z M328.5,75.1c0,0-0.8-0.7-2.3-2.1c-1.6-1.3-3.9-3.3-7.3-5.4c-3.4-2.1-7.8-4.4-13.2-6.3c-5.4-2-11.9-3.7-19.2-5.1c-3.7-0.7-7.5-1.3-11.6-2c-4.1-0.6-8.4-1.2-12.8-1.9c-4.5-0.7-9.1-1.4-13.9-2.4c-4.8-1-9.7-2.4-14.6-4c-9.9-3.3-20.2-7.5-31.2-11.3c-5.5-1.9-11.2-3.6-17.1-4.9c-5.9-1.2-12.1-2-18.4-1.7c-6.3,0.3-12.6,1.7-18.5,4.4C142.4,35,137,39,131.9,43.5c-10.1,9.1-18.8,20.5-28.2,31.8c-2.4,2.8-4.8,5.7-7.3,8.4c-1.3,1.4-2.5,2.8-3.9,4.2l-2,2l-2,2c-5.5,5.3-11.4,10.2-17.4,15.1c-6,4.9-12,9.8-17.8,15c-5.8,5.2-11.3,10.8-15.8,17.3c-2.2,3.2-4.2,6.6-5.7,10.3c-0.4,0.9-0.7,1.8-1,2.7c-0.3,0.9-0.6,1.9-0.9,2.9c-0.2,0.9-0.5,1.9-0.7,2.8c-0.2,1-0.4,1.9-0.5,2.9c-1.2,7.8-0.5,15.9,1.2,23.9c3.5,15.9,10.6,31.1,16,47.1c1.3,4,2.6,8.1,3.6,12.2c1,4.1,1.8,8.3,2.5,12.5c1.4,8.4,2.4,16.8,3.8,25.2c1.4,8.4,3.2,16.7,6.2,24.6c3,7.9,7.3,15.3,13.2,21.3c5.9,6,13.3,10.4,21.2,13.5c7.9,3.1,16.2,5,24.6,6.5c8.4,1.5,16.8,2.6,25.1,4c4.2,0.7,8.3,1.6,12.5,2.6c4.1,1,8.1,2.3,12.1,3.7c8,2.8,15.7,5.9,23.5,8.8c7.8,2.9,15.6,5.6,23.7,7.4c8,1.7,16.2,2.5,24.2,1.3c8-1.2,15.4-4.5,21.9-9c6.5-4.5,12.1-10.1,17.4-15.9c5.2-5.8,10.1-11.9,14.9-17.9c4.9-6,9.7-11.9,15-17.4c5.3-5.5,10.9-10.4,16.6-15.1c11.3-9.4,22.7-18.1,31.8-28.2c4.6-5.1,8.5-10.5,11.2-16.4c0.3-0.7,0.6-1.5,1-2.2c0.3-0.7,0.6-1.5,0.8-2.2c0.3-0.7,0.5-1.6,0.7-2.3l0.2-0.6c0-0.1,0.1-0.4,0.1-0.6l0.3-1.2c0.7-3.1,1.1-6.3,1.3-9.4c0.3-6.3-0.5-12.5-1.7-18.4c-1.3-5.9-3-11.6-4.9-17.2c-3.8-11-8-21.3-11.2-31.2c-1.6-5-3-9.9-4-14.6c-1-4.8-1.7-9.4-2.4-13.9c-0.6-4.5-1.2-8.7-1.8-12.8c-0.6-4.1-1.2-8-1.9-11.6c-1.4-7.3-3-13.8-5-19.3c-1.9-5.5-4.2-9.9-6.3-13.3c-2.1-3.4-4.1-5.8-5.4-7.3C329.3,75.9,328.5,75.1,328.5,75.1z"/>
  </g>
</svg>
`;

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

const normalizeVehicleNumber = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const sanitizeOutput = (text: string) => text.replace(/_/g, " ");

const extractVehicleNumber = (question: string) => {
  const matchers = [
    /(?:vehicle|veh|lorry|reg)\s*(?:no\.?|number)?\s*[:#-]?\s*(\d[\d-]*)/i,
    /ending\s+(?:with|in)\s+(?:vehicle\s+(?:number|no\.?)\s*)?(\d[\d-]*)/i,
    /(?:number|no\.?)\s*[:#-]?\s*(\d[\d-]*)/i,
  ];

  for (const matcher of matchers) {
    const explicitMatch = question.match(matcher);

    if (explicitMatch?.[1]) {
      return explicitMatch[1];
    }
  }

  const numericTokens = question.match(/\d[\d-]*/g) || [];

  return numericTokens[numericTokens.length - 1] || "";
};

const findMatchingVehicle = (
  question: string,
  vehicles: VehicleData[],
  selectedVehicle: VehicleData | null,
) => {
  const vehicleNumber = extractVehicleNumber(question);
  const hasVehicleReference = /vehicle|veh|lorry|reg|number|no\.?/i.test(
    question,
  );

  if (vehicleNumber) {
    const normalizedVehicleNumber = normalizeVehicleNumber(vehicleNumber);

    const matchedVehicle = vehicles.find((vehicle) => {
      const normalizedReg = normalizeVehicleNumber(vehicle.vehReg || "");

      return (
        normalizedReg.includes(normalizedVehicleNumber) ||
        normalizedVehicleNumber.includes(normalizedReg)
      );
    });

    if (matchedVehicle) {
      return matchedVehicle;
    }
  }

  if (hasVehicleReference) {
    return null;
  }

  if (selectedVehicle?.vId || selectedVehicle?.vehReg) {
    return selectedVehicle;
  }

  return null;
};

const getVehicleAddress = (vehicle: VehicleData) =>
  vehicle.GPSInfo?.addr ||
  vehicle.gpsDtl?.latLngDtl?.addr ||
  vehicle.gpsDtl?.veh_destinationShow ||
  "Location not available";

const getVehicleTime = (vehicle: VehicleData) =>
  vehicle.GPSInfo?.gpstime ||
  vehicle.gpsDtl?.modeTimeFormat ||
  vehicle.gpsDtl?.modeTime ||
  "";

const getVehicleLocationSummary = (vehicle: VehicleData) => {
  const address = sanitizeOutput(getVehicleAddress(vehicle));
  const gpsTime = getVehicleTime(vehicle);
  const speed = vehicle.gpsDtl?.speed ?? 0;
  const mode = sanitizeOutput(
    vehicle.gpsDtl?.mode || vehicle.vehicleState || "Not available",
  );

  return [
    `Vehicle ${sanitizeOutput(vehicle.vehReg)} is currently at ${address}.`,
    gpsTime ? `Last updated at ${gpsTime}.` : "",
    `Speed: ${speed} km/h.`,
    `Status: ${mode}.`,
  ]
    .filter(Boolean)
    .join(" ");
};

const getVehicleFuelSummary = (vehicle: VehicleData) => {
  const fuel = vehicle.gpsDtl?.fuel;
  const lastFuelFilled = vehicle.gpsDtl?.lastfuelfilled;
  const lastFilledTime = vehicle.gpsDtl?.lastfilledTime;

  return [
    `Vehicle ${sanitizeOutput(vehicle.vehReg)} fuel reading is ${fuel ?? "Not available"}.`,
    `Last fuel filled: ${lastFuelFilled ?? "Not available"}.`,
    lastFilledTime ? `Last filled time: ${lastFilledTime}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
};

const getVehicleStatusSummary = (vehicle: VehicleData) => {
  const mode = sanitizeOutput(
    vehicle.gpsDtl?.mode || vehicle.vehicleState || "Not available",
  );
  const ignState = sanitizeOutput(vehicle.gpsDtl?.ignState || "Not available");
  const acState = sanitizeOutput(vehicle.gpsDtl?.acState || "Not available");
  const gpsStatus = vehicle.gpsDtl?.gpsStatus
    ? sanitizeOutput(String(vehicle.gpsDtl.gpsStatus))
    : "Not available";

  return [
    `Vehicle ${sanitizeOutput(vehicle.vehReg)} status is ${mode}.`,
    `Ignition: ${ignState}.`,
    `AC: ${acState}.`,
    gpsStatus !== "Not available" ? `GPS status: ${gpsStatus}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
};

const getVehicleDriverSummary = (vehicle: VehicleData) => {
  const driverName = sanitizeOutput(
    vehicle.drivers?.driverName || "Not available",
  );
  const phoneNumber = sanitizeOutput(
    vehicle.drivers?.phoneNumber || "Not available",
  );

  return `Vehicle ${sanitizeOutput(vehicle.vehReg)} driver is ${driverName}. Contact number: ${phoneNumber}.`;
};

const getVehicleBatterySummary = (vehicle: VehicleData) => {
  const voltage = vehicle.gpsDtl?.main_powervoltage;
  const batteryPercent = vehicle.gpsDtl?.percentageBttry;

  return [
    `Vehicle ${sanitizeOutput(vehicle.vehReg)} battery voltage is ${voltage ?? "Not available"}.`,
    `Battery percentage is ${batteryPercent ?? "Not available"}.`,
  ].join(" ");
};

const getVehicleAlertSummary = (vehicle: VehicleData) => {
  const alertCount = vehicle.gpsDtl?.alertCount ?? 0;
  const ticketStatus = sanitizeOutput(
    vehicle.gpsDtl?.ticket_status || "Not available",
  );

  return `Vehicle ${sanitizeOutput(vehicle.vehReg)} has ${alertCount} active alerts. Ticket status: ${ticketStatus}.`;
};

const getVehicleOdometerSummary = (vehicle: VehicleData) => {
  const odometer = vehicle.gpsDtl?.tel_odometer;
  const distance = vehicle.disInKM;

  return [
    `Vehicle ${sanitizeOutput(vehicle.vehReg)} odometer reading is ${odometer ?? "Not available"}.`,
    `Distance from dashboard data: ${distance ?? "Not available"} km.`,
  ].join(" ");
};

const getFleetFuelSummary = (vehicles: VehicleData[]) => {
  const fuelReadings = vehicles
    .map((vehicle) => vehicle.gpsDtl?.fuel)
    .filter((value): value is number => typeof value === "number");

  if (!fuelReadings.length) {
    return "Fuel data is not available for the current fleet.";
  }

  const averageFuel =
    fuelReadings.reduce((sum, value) => sum + value, 0) / fuelReadings.length;
  const lowestFuel = Math.min(...fuelReadings);
  const highestFuel = Math.max(...fuelReadings);

  return `Fleet fuel snapshot: ${fuelReadings.length} vehicles have fuel data. Average fuel reading is ${averageFuel.toFixed(1)}. Lowest reading is ${lowestFuel}. Highest reading is ${highestFuel}.`;
};

const buildChatAnswer = (
  question: string,
  vehicles: VehicleData[],
  selectedVehicle: VehicleData | null,
) => {
  const normalizedQuestion = question.toLowerCase();
  const matchedVehicle = findMatchingVehicle(
    question,
    vehicles,
    selectedVehicle,
  );
  const hasVehicleReference = Boolean(
    extractVehicleNumber(question) || matchedVehicle?.vehReg,
  );

  if (
    /help|what can you do|possible questions|questions/i.test(
      normalizedQuestion,
    )
  ) {
    return [
      "I can answer live vehicle questions from the Mob dashboard data.",
      "Try asking: where is my vehicle no. 123, what is the fuel status, what is the speed, who is the driver, what is the battery status, is the vehicle running, or what is the GPS status.",
    ].join(" ");
  }

  if (!matchedVehicle && hasVehicleReference) {
    return `I could not find a live vehicle matching "${extractVehicleNumber(question)}" in the current fleet data.`;
  }

  if (
    /where|location|locate|address|current position|current location/i.test(
      normalizedQuestion,
    )
  ) {
    return matchedVehicle
      ? getVehicleLocationSummary(matchedVehicle)
      : "Please mention the vehicle number so I can fetch its current location from the live fleet data.";
  }

  if (
    /fuel|fuel status|last fuel|fuel filled|fuel fill|theft/i.test(
      normalizedQuestion,
    )
  ) {
    if (matchedVehicle) {
      return getVehicleFuelSummary(matchedVehicle);
    }

    return "Please mention the vehicle number so I can check its fuel status.";
  }

  if (/speed/i.test(normalizedQuestion)) {
    return matchedVehicle
      ? `Vehicle ${sanitizeOutput(matchedVehicle.vehReg)} speed is ${matchedVehicle.gpsDtl?.speed ?? "Not available"} km/h.`
      : "Please mention the vehicle number so I can check its speed.";
  }

  if (/driver|contact/i.test(normalizedQuestion)) {
    return matchedVehicle
      ? getVehicleDriverSummary(matchedVehicle)
      : "Please mention the vehicle number so I can fetch the driver details.";
  }

  if (/battery|voltage|power/i.test(normalizedQuestion)) {
    return matchedVehicle
      ? getVehicleBatterySummary(matchedVehicle)
      : "Please mention the vehicle number so I can fetch the battery status.";
  }

  if (/alert|alarm|panic/i.test(normalizedQuestion)) {
    return matchedVehicle
      ? getVehicleAlertSummary(matchedVehicle)
      : "Please mention the vehicle number so I can fetch the alert status.";
  }

  if (/odometer|distance|km/i.test(normalizedQuestion)) {
    return matchedVehicle
      ? getVehicleOdometerSummary(matchedVehicle)
      : "Please mention the vehicle number so I can fetch the odometer reading.";
  }

  if (
    /ignition|ign/i.test(normalizedQuestion) ||
    /running|idle|stopped|trip|status/i.test(normalizedQuestion)
  ) {
    return matchedVehicle
      ? getVehicleStatusSummary(matchedVehicle)
      : "Please mention the vehicle number so I can fetch the live status.";
  }

  if (/ac|air conditioning/i.test(normalizedQuestion)) {
    return matchedVehicle
      ? `Vehicle ${sanitizeOutput(matchedVehicle.vehReg)} AC status is ${sanitizeOutput(matchedVehicle.gpsDtl?.acState || "Not available")}.`
      : "Please mention the vehicle number so I can fetch the AC status.";
  }

  if (/gps/i.test(normalizedQuestion)) {
    return matchedVehicle
      ? `Vehicle ${sanitizeOutput(matchedVehicle.vehReg)} GPS status is ${matchedVehicle.gpsDtl?.gpsStatus ?? "Not available"}. Current position: ${sanitizeOutput(getVehicleAddress(matchedVehicle))}.`
      : "Please mention the vehicle number so I can fetch the GPS status.";
  }

  if (matchedVehicle) {
    return [
      getVehicleLocationSummary(matchedVehicle),
      getVehicleFuelSummary(matchedVehicle),
      getVehicleStatusSummary(matchedVehicle),
    ].join(" ");
  }

  return "I can answer live fleet questions like location, fuel, speed, driver, status, GPS, battery, alerts, odometer, and ignition. Please include a vehicle number for a precise answer.";
};

const Orb = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content: "How can we help you today?",
    },
  ]);

  const [timeStr, setTimeStr] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const categories = [
    "Vehicle Tracking & Status",
    "Fuel & Mileage",
    "Dashcam",
    "Alerts & Safety",
    "POI & Geofence",
    "Diagnostic Trouble Code",
    "Trips & Routes",
  ];

  const { userId, groupId, parentUser } = useSelector(
    (state: RootState) => state.auth,
  );

  const selectedVehicle = useSelector(
    (state: RootState) => state.selectedVehicle,
  );

  const { data: vehicleData } = useGetVehiclesByStatusQuery(
    {
      token: groupId,
      userId,
      pUserId: parentUser,
      mode: "",
    },
    {
      skip: !groupId || !userId,
      refetchOnMountOrArgChange: true,
    },
  );

  const vehicles = vehicleData?.list || [];

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const time = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setTimeStr(`Today, ${time}`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const question = message.trim();

    if (!question) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: question,
    };

    const assistantMessage: ChatMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content: buildChatAnswer(question, vehicles, selectedVehicle),
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
      assistantMessage,
    ]);
    setMessage("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      <div
        className={`mb-1 w-[340px] transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100 scale-100"
            : "pointer-events-none translate-y-4 opacity-0 scale-95"
        }`}
      >
        <div className="rounded-[28px] bg-[#202940] p-2 shadow-2xl">
          {/* Header */}
          <div className="relative overflow-hidden rounded-[22px] px-3 pb-1 pt-3 text-white">
            <div className="absolute right-3 top-3 flex items-center gap-2 hover:bg-white/10 rounded-full transition-colors">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-9 w-9 rounded-full bg-white/12 flex items-center justify-center text-white/90"
                aria-label="Minimize"
              >
                &minus;
              </button>
            </div>

            <div className="flex min-h-[90px] flex-col items-start justify-start gap-1 pl-2 pr-16 pt-2 text-left">
              <Image
                src="/assets/images/common/logo.png"
                alt="Logo"
                width={76}
                height={76}
                className="h-auto w-[78px]"
              />
            </div>
          </div>

          {/* Body */}
          <div className="-mt-7 rounded-[22px] bg-white p-3 shadow-[0_-10px_24px_rgba(0,0,0,0.08)]">
            <div className="text-center text-xs text-slate-400 mb-2">
              {timeStr}
            </div>

            {/* Category buttons (outline theme) */}
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setMessage(cat)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none"
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="max-h-[230px] space-y-3 overflow-y-auto pr-1">
              {messages.map((item) =>
                item.role === "assistant" ? (
                  <div key={item.id} className="flex items-start gap-1">
                    <div className="h-5 w-8 rounded-full bg-white shadow-sm flex items-center justify-center text-violet-600">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#7b4bff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </div>
                    <div className="bg-slate-100 text-slate-800 rounded-2xl p-3 max-w-[85%] whitespace-pre-wrap leading-6 break-words">
                      <div className="text-sm leading-6">{item.content}</div>
                    </div>
                  </div>
                ) : (
                  <div key={item.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl bg-gradient-to-r from-[#7b4bff] to-[#33aaff] px-4 py-3 text-sm leading-6 text-white whitespace-pre-wrap shadow-md">
                      {item.content}
                    </div>
                  </div>
                ),
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              className="flex items-center gap-3 border-t pt-3"
              onSubmit={handleSubmit}
            >
              <input
                placeholder="Type and press [enter]"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                aria-label="chat input"
              />
              <button
                type="button"
                onClick={() => setMessage("")}
                disabled={!message}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Clear input"
              >
                <span className="block -translate-y-px text-[18px] leading-none font-medium text-slate-500">
                  ×
                </span>
              </button>
              <button
                type="submit"
                className="h-10 w-10 rounded-full bg-gradient-to-r from-[#7b4bff] to-[#33aaff] text-white flex items-center justify-center shadow-md"
                aria-label="Send message"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 2L11 13"></path>
                  <path d="M22 2l-7 20l-4-9l-9-4l20-7z"></path>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Launcher orb */}
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className="relative z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black p-0 shadow-[0_8px_24px_rgba(0,0,0,0.22)]"
        aria-label={isOpen ? "Minimize chat" : "Open chat"}
      >
        <span className="orb-svg-root pointer-events-none block h-[35px] w-[35px] overflow-hidden rounded-full">
          <span
            className="block h-full w-full"
            dangerouslySetInnerHTML={{ __html: orbSvg }}
          />
        </span>
      </button>

      <style jsx global>{`
        * {
          transform-origin: 50% 50%;
        }
        .orb-svg-root svg {
          width: 35px;
          height: 35px;
          display: block;
          filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.45));
        }
        #ring1 {
          animation: ring1 10s linear infinite;
        }
        #ring2 {
          animation: ring2 10s linear infinite;
        }
        #ring3 {
          animation: ring3 7s linear infinite;
        }
        #Orb,
        #Orb_1_ {
          animation: orb 2s linear infinite alternate;
        }
        @keyframes ring1 {
          0% {
            transform: rotate(0deg) scale(1);
          }
          25% {
            transform: rotate(90deg) scale(1.05);
          }
          50% {
            transform: rotate(180deg) scale(1);
          }
          75% {
            transform: rotate(270deg) scale(1.05);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }
        @keyframes ring2 {
          0% {
            transform: rotate(360deg) scale(1);
          }
          25% {
            transform: rotate(270deg) scale(0.95);
          }
          50% {
            transform: rotate(180deg) scale(1);
          }
          75% {
            transform: rotate(90deg) scale(1.05);
          }
          100% {
            transform: rotate(0deg) scale(1);
          }
        }
        @keyframes ring3 {
          0% {
            transform: rotate(360deg) scale(1);
          }
          25% {
            transform: rotate(270deg) scale(1.05);
          }
          50% {
            transform: rotate(180deg) scale(1);
          }
          75% {
            transform: rotate(90deg) scale(1.05);
          }
          100% {
            transform: rotate(0deg) scale(1);
          }
        }
        @keyframes orb {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default Orb;
