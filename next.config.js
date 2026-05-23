module.exports = {
  async rewrites() {
    return [
      {
        source: "/proxy/:path*",
        destination: "https://idp-integ.federate.amazon.com/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "files.imettax.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "files-india.imettax.com",
        port: "",
      },
      {
        protocol: "http",
        hostname: "103.91.90.235",
        port: "",
      },
      {
        protocol: "https",
        hostname: "gtrac.in",
        port: "",
      },
      {
        protocol: "https",
        hostname: "y.gpstracktech.com",
        port: "",
      },
    ],
  },

  webpack: (config, { isServer }) => {
    // Add a rule to handle audio files
    config.module.rules.push({
      test: /\.(mp3|wav|ogg)$/,
      use: [
        {
          loader: "file-loader",
          options: {
            name: "[name].[ext]",
            outputPath: "static/assets/audio/",
            publicPath: "/_next/static/assets/audio/",
          },
        },
      ],
    });

    // Important: return the modified config
    return config;
  },
};
