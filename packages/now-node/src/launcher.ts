export function makeLauncher(
  entrypoint: string,
  shouldAddHelpers: boolean
): string {
  return `const { Bridge } = require("./bridge");
const { Server } = require("http");

let isServerListening = false;
let bridge = new Bridge();
const saveListen = Server.prototype.listen;
Server.prototype.listen = function listen() {
  isServerListening = true;
  console.log('Legacy server listening...');
  bridge.setServer(this);
  Server.prototype.listen = saveListen;
  return bridge.listen();
};

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV =
    process.env.NOW_REGION === 'dev1' ? 'development' : 'production';
}

try {
  let listener = require("./${entrypoint}");
  if (listener.default) listener = listener.default;

  if (typeof listener.listen === 'function') {
    Server.prototype.listen = saveListen;
    const server = listener;
    bridge.setServer(server);
    bridge.listen();
  } else if (typeof listener === 'function') {
    Server.prototype.listen = saveListen;
    let server;
    ${
      shouldAddHelpers
        ? [
            'bridge = new Bridge(undefined, true);',
            'server = require("./helpers").createServerWithHelpers(listener, bridge);',
          ].join('\n')
        : ['server = require("http").createServer(listener);'].join('\n')
    }
    bridge.setServer(server);
    bridge.listen();
  } else if (typeof listener === 'object' && Object.keys(listener).length === 0) {
    if (!isServerListening) {
      setTimeout(() => {
        if (!isServerListening) {
          console.error('No export detected.');
          console.error('Did you forget to export a function or a server?');
          process.exit(1);
        }
      }, 1000);
    }
  } else {
    console.error('Export is invalid.');
    console.error('The default export must be a function or server.');
  }
} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND') {
    console.error(err.message);
    console.error('Did you forget to add it to "dependencies" in \`package.json\`?');
    process.exit(1);
  } else {
    console.error(err);
    process.exit(1);
  }
}

exports.launcher = bridge.launcher;`;
}
