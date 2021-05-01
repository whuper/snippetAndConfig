	console.log(555);
  var spawn = require('child_process').spawn;
  var createHash = require('crypto').createHash;
  var $__3 = require('fs'),
      createReadStream = $__3.createReadStream,
      createWriteStream = $__3.createWriteStream,
      stat = $__3.stat,
      unlink = $__3.unlink;
  var tmpdir = require('os').tmpdir;

  var $__5 = require('path'),
      dirname = $__5.dirname,
      resolve = $__5.resolve;
  var $__6 = process,
      execPath = $__6.execPath,
      platform = $__6.platform;
  var semver = require('semver');
  var shell = require('shelljs');

  var SYSTEM_TEMP_DIR = tmpdir();

  var UPDATER_TEMP_DIR = resolve(SYSTEM_TEMP_DIR, 'my-app-updater');
  var UPDATES_DIR = resolve(UPDATER_TEMP_DIR, 'updates');
  var UPDATER_BIN = resolve(UPDATER_TEMP_DIR, /^win/.test(platform) ? 'updater.exe' : 'updater');

  shell.mkdir('-p', UPDATES_DIR);

	//var gui = require('nw.gui');
	var nw = require('nw');

  var appManifest = nw.App.manifest;
  var remoteManifestUrl = appManifest.manifestUrl;
  var $__9 = resolvePaths(execPath, platform),
      appInstDir = $__9.appInstDir,
      bundledUpdaterPath = $__9.bundledUpdaterPath;


  run('index.html?clz=/eh.portal.Portal', appManifest.window).then(function() {
    return fetchManifest(remoteManifestUrl).then(function(remoteManifest) {
      var currentVersion = appManifest.version;
      var $__11 = remoteManifest,
          latestVersion = $__11.version,
          bundle = $__11[platform];
      if (semver.gt(latestVersion, currentVersion)) {
        var bundlePath = resolve(UPDATES_DIR, hashString(latestVersion));
        return fetchUpdate(bundle, bundlePath).then(notifyUser).then(function(result) {
          if (result) {
            startUpdate(bundlePath);
          }
        });
      }
    });
  }).catch(function() {});

  function resolvePaths(execPath, platform) {
    var appDir;
    var appInstDir;
    var appExec;
    var bundledUpdaterPath;
    if (platform === 'darwin') {
      appDir = resolve(execPath, '../../../../../../../');
      appInstDir = dirname(appDir);
      appExec = appDir;
      bundledUpdaterPath = resolve(appDir, 'Contents', 'Resources', 'updater');
    } else if (platform === 'win32') {
      appDir = dirname(execPath);
      appInstDir = appDir;
      appExec = resolve(appDir, 'MyApp.exe');
      bundledUpdaterPath = resolve(appDir, 'updater.exe');
    } else {
      appDir = dirname(execPath);
      appInstDir = appDir;
      appExec = resolve(appDir, 'MyApp');
      bundledUpdaterPath = resolve(appDir, 'updater');
    }
    return {
      appDir: appDir,
      appInstDir: appInstDir,
      appExec: appExec,
      bundledUpdaterPath: bundledUpdaterPath
    };
  }

  function hashString(value) {
    var algorithm = arguments[1] !== (void 0) ? arguments[1] : 'sha256';
    var inputEncoding = arguments[2] !== (void 0) ? arguments[2] : 'latin1';
    var digestEncoding = arguments[3] !== (void 0) ? arguments[3] : 'hex';
    return createHash(algorithm).update(value, inputEncoding).digest(digestEncoding);
  }

  function startUpdate(bundlePath) {
    shell.cp(bundledUpdaterPath, UPDATER_BIN);
    shell.chmod(755 & ~process.umask(), UPDATER_BIN);
    spawn(UPDATER_BIN, ['--bundle', bundlePath, '--inst-dir', appInstDir], {
      cwd: dirname(UPDATER_BIN),
      detached: true,
      stdio: 'ignore'
    }).unref();
    nw.App.quit();
  }

  function fetchUpdate($__10, dest) {
    var $__11 = $__10,
        url = $__11.url,
        sha256 = $__11.sha256;
    return fileExists(dest).then(function(exists) {
      if (exists) {
        return checkSHA(dest, sha256).then(function() {
          return Promise.resolve(dest);
        }).catch(function(err) {
          if (/^SHA256 mismatch/.test(err.message)) {
            return removeFile(dest).then(function() {
              return downloadFile(url, dest, sha256);
            });
          }
          return Promise.reject(err);
        });
      }
      return downloadFile(url, dest, sha256);
    });
  }

  function fetchManifest(url) {
    return new Promise(function(resolve, reject) {
      var http = /^https/.test(url) ? nw.require('https') : nw.require('http');
      http.get(url, function(res) {
        if (res.statusCode !== 200) {
          return reject(new Error(res.statusMessage));
        }
        var buffer = [];
        res.on('data', function(chunk) {
          return buffer.push(chunk);
        });
        res.on('end', function() {
          var raw = Buffer.concat(buffer).toString();
          var manifest = JSON.parse(raw);
          resolve(manifest);
        });
      }).on('error', function(err) {
        return reject(err);
      });
    });
  }

  function downloadFile(source, dest) {
    var sha256 = arguments[2] !== (void 0) ? arguments[2] : false;
    return new Promise(function(resolve, reject) {
      var ws = createWriteStream(dest);
      var http = /^https/.test(source) ? nw.require('https') : nw.require('http');
      http.get(source, function(res) {
        if (res.statusCode !== 200) {
          return reject(new Error(res.statusMessage));
        }
        res.pipe(ws).on('finish', function() {
          if (!sha256) {
            return resolve(dest);
          }
          checkSHA(dest, sha256).then(function() {
            return resolve(dest);
          }).catch(function(err) {
            return reject(err);
          });
        });
      }).on('error', function(err) {
        return reject(err);
      });
    });
  }

  function checkSHA(filepath, sha256) {
    return new Promise(function(resolve, reject) {
      var rs = createReadStream(filepath);
      var hash = createHash('sha256');
      rs.pipe(hash).on('data', function(digest) {
        var digestHex = digest.toString('hex');
        if (digestHex !== sha256) {
          return reject(new Error(("SHA256 mismatch: " + sha256 + " !== " + digestHex)));
        }
        resolve();
      });
    });
  }

  function notifyUser() {
    return new Promise(function(resolve) {
      var options = {
        icon: 'icons/update.png',
        body: 'Click here to install'
      };
      var notification = new Notification('A new update is available!', options);
      notification.onclick = function() {
        notification.close();
        resolve(true);
      };
      notification.onclose = function() {
        return resolve(false);
      };
    });
  }

  function run(entryFile, windowParams) {
    return new Promise(function(resolve) {
      nw.Window.open(entryFile, windowParams, function(win) {
        return resolve(win);
      });
    });
  }

  function removeFile(filepath) {
    return new Promise(function(resolve, reject) {
      unlink(filepath, function(err) {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  
	}

  function fileExists(bundledUpdaterPath) {
    return new Promise(function(resolve) {
      stat(bundledUpdaterPath, function(err, stats) {
        if (err) {
          if (err.code === 'ENOENT') {
            return resolve(false);
          }
          throw err;
        }
        if (stats.isFile()) {
          return resolve(true);
        }
        resolve(false);
      });
    });
  }
