const { createLambda } = require('@now/build-utils/lambda.js'); // eslint-disable-line import/no-extraneous-dependencies
const path = require('path');
const rename = require('@now/build-utils/fs/rename.js'); // eslint-disable-line import/no-extraneous-dependencies
const { getFiles } = require('@now/php-bridge');
const minimatch = require('minimatch');

exports.config = {
  maxLambdaSize: '10mb',
};

exports.build = async ({ files, entrypoint, config }) => {
  // Fetch the included files config, or default (**)
  const includedFilesGlob = (config ? config.includeFiles : false) || '**';
  let includedFiles = files;
  if (includedFilesGlob !== '**') {
    // match the files with the glob
    includedFiles = Object.keys(files)
      .filter(minimatch.filter(includedFilesGlob))
      .reduce((res, key) => {
        res[key] = files[key];
        return res;
      }, {});
    // explicit and always include the entrypoint
    includedFiles[entrypoint] = files[entrypoint];
  }
  // move all user code to 'user' subdirectory
  const userFiles = rename(includedFiles, name => path.join('user', name));
  const bridgeFiles = await getFiles();

  // TODO config.extensions. OR php.ini from user
  delete bridgeFiles['native/modules/mysqli.so'];
  delete bridgeFiles['native/modules/libmysqlclient.so.16'];

  const lambda = await createLambda({
    files: { ...userFiles, ...bridgeFiles },
    handler: 'launcher.launcher',
    runtime: 'nodejs8.10',
    environment: {
      NOW_ENTRYPOINT: entrypoint,
    },
  });

  return { [entrypoint]: lambda };
};
