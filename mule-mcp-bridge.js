#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

const server = new Server(
  {
    name: 'mule-mcp-bridge',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'Test4',
        description: 'Simple test tool for MCP connection with Cursor AI',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Optional test message',
              default: 'Hello from Mule MCP Server'
            }
          },
          required: []
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name !== 'Test4') {
    throw new Error(`Unknown tool: ${name}`);
  }

  try {
    // Make HTTP request to Mule server
    const muleUrl = process.env.MCP_SERVER_URL || 'http://localhost:8081';
    
    // For this simple case, we'll make a basic HTTP request
    // In a real implementation, you'd need to handle the SSE connection properly
    const response = await fetch(`${muleUrl}/mcp/tools/Test4`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args || {})
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();
    
    return {
      content: [
        {
          type: 'text',
          text: result
        }
      ]
    };
  } catch (error) {
    throw new Error(`Failed to call Mule MCP server: ${error.message}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Mule MCP Bridge Server running on stdio');
}

main().catch((error) => {
  console.error('Bridge server error:', error);
  process.exit(1);
});
