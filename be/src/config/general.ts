export const welcomeHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hostify API</title>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f4f4f4;
              }
              h1 {
                color: #333;
              }
              p {
                color: #666;
              }
              a {
                color: #007acc;
                text-decoration: none;
              }
              a:hover {
                text-decoration: underline;
              }
            </style>
        </head>
        <body>
          <h1>Welcome to Hostify API</h1>
          <p>Automatically deploy static websites from GitHub repositories to Azure Blob Storage with custom subdomain support and Cloudflare KV integration.</p>
          <p>Explore the <a href="/api/docs">API Documentation</a> to get started.</p>
          <p>Visit our <a href="/api/redoc">ReDoc Documentation</a> for an alternative API reference.</p>
          <p>Check out our <a href="/api/swagger.json">Swagger JSON</a> for the raw OpenAPI specification.</p> 
        </body>
      </html>
    `;
