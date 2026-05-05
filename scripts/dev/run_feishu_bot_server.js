"use strict";

const { startFeishuBotServer } = require("../../src/integrations/feishu/bot_server");

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[++index] : true;
    args[key] = value;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const { host, port } = await startFeishuBotServer({
    host: args.host,
    port: args.port
  });

  process.stdout.write(JSON.stringify({
    status: "listening",
    host,
    port,
    webhook: `http://${host}:${port}/webhook/feishu/bot`,
    health: `http://${host}:${port}/health`
  }, null, 2) + "\n");
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
