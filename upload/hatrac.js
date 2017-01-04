window.hatrac = window.hatrac || {};

(function(module) {

    "use strict";

    /**
     * HttpRequest Object
     * Create a new instance with new HttpRequest(request)
     * To start request, call send(onSucessCB, onErrorCB)
     *
     * @param {type} request An object with url, HTTPMethod, headers array and data
     * {
     *  url: "https://example.com/some_full_url",                   //Required
     *  method: "PUT",                                              //Optional
     *  headers: [{ key: "content-type": "application/json" }],     //Optional
     *  data: { "name": "value" }                                   //Optional
     * }
     *
     */
    module.HttpRequest = function(request) {

        if (!request) throw new Error("Please specify request");

        if (!request.url) throw new Error("Please specify request url");
        if (!request.method) request.method = 'GET';
        if (!request.headers) request.headers = [];
        var data = {};

        var doNotStringify = true;
        request.headers.forEach(function(r) {
            if (r.key.toLowerCase() == 'content-type') {
                doNotStringify = true;
                if (r.value.toLowerCase() == 'application/json' || r.value.toLowerCase() == "application/javascript" || r.value.toLowerCase() == 'application/json; charset=utf-8' || r.value.toLowerCase() == 'application/json; charset=utf-8;') {
                    doNotStringify = false;
                }
            }
        });


        if (doNotStringify) data = request.data;
        else {
            if (request.data) {
                if (typeof request.data == 'object') {
                    try {
                        request.data = JSON.stringify(request.data);
                    } catch (e) {}
                }
            }
        }

        this.request = request;
    };

    /**
     * XmlHttpRequest's getAllResponseHeaders() method returns a string of response
     * headers according to the format described here:
     * http://www.w3.org/TR/XMLHttpRequest/#the-getallresponseheaders-method
     * This method parses that string into a user-friendly key/value pair object.
     */
    var parseResponseHeaders = function (headerStr) {
      var headers = {};
      if (!headerStr) {
        return headers;
      }
      var headerPairs = headerStr.split('\u000d\u000a');
      for (var i = 0; i < headerPairs.length; i++) {
        var headerPair = headerPairs[i];
        // Can't use split() here because it does the wrong thing
        // if the header value has the string ": " in it.
        var index = headerPair.indexOf('\u003a\u0020');
        if (index > 0) {
          var key = headerPair.substring(0, index);
          var val = headerPair.substring(index + 2);
          headers[key] = val;
        }
      }
      return headers;
    };

    module.HttpRequest.prototype.send = function(onSuccess, onError) {

        var request = this.request;

        if (!onSuccess || !(typeof onSuccess == 'function')) onSuccess = function() {};
        if (!onError || !(typeof onError == 'function')) onError = function() {};

        var xhr = new _xmlHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                xhr.headers = parseResponseHeaders(xhr.getAllResponseHeaders());
                var response = xhr.responseText;
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                    onSuccess(response, xhr);
                } else {
                    onError(xhr.status, response, xhr);
                }
            }
        };

        xhr.open(request.method, request.url, request.sync ? false : true);

        for (var x = 0; x < request.headers.length; x += 1)
            xhr.setRequestHeader(request.headers[x].key, request.headers[x].value);

        xhr.send(request.data);
    };
})(hatrac || {});

(function(module) {

    var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;

    var ChecksumMD5 = function(file, options) {
        this.file = self;
        this.options = options || {};
    };

    ChecksumMD5.prototype.hash = function(onSuccess, onError) {

        var self = this;
        if (!onSuccess || !(typeof onSuccess == 'function')) onSuccess = function() {};
        if (!onError || !(typeof onError == 'function')) onError = function() {};


        var chunkSize = 5 * 1024 * 1024, // read in chunks of 5MB
        chunks = Math.ceil(file.size / chunkSize),
        currentChunk = 0,
        spark = new SparkMD5.ArrayBuffer();

        var onLoad = function(e) {
            console.log("\nRead chunk number " + parseInt(currentChunk + 1) + " of " + chunks);
            spark.append(e.target.result); // append array buffer
            currentChunk++;
            if (currentChunk < chunks)
                loadNext();
            else {
                self.checksum = spark.end();
                console.log("\nFinished loading :)\n\nComputed hash:\n" + self.checksum + "!\n");
                onSuccess(self.checksum, self);
            }
        };
        
        var loadNext = function () {
            var fileReader = new FileReader();
            fileReader.onload = onLoad;
            fileReader.onerror = onError;
            var start = currentChunk * chunkSize,
                end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;
            fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
        };
        
        loadNext();
    };

    module.ChecksumMD5 = ChecksumMD5;

})(hatrac || {});

(function(module) {
    /**
     * HatracMultiUpload Object
     * Create a new instance with new HatracMultiUpload(file, otherInfo)
     * To start uploading, call start()
     * You can pause with pause()
     * Resume with resume()
     * Cancel with cancel()
     *
     * You can override the following functions (no event emitter :( , description below on the function definition, at the end of the file)
     * onServerError = function(command, jqXHR, textStatus, errorThrown) {}
     * onUploadError = function(xhr) {}
     * onProgressChanged = function(uploadingSize, uploadedSize, totalSize) {}
     * onUploadCompleted = function() {}
     *
     * @param {type} file
     * @param {type} otherInfo
     * @returns {MultiUpload}
     */
    var upload = function (file, otherInfo) {
        
        this.PART_SIZE = 5 * 1024 * 1024; //minimum part size defined by hatrac

        this.SERVER_LOC = otherInfo.url; //location of the server
        
        this.RETRY_WAIT_SEC = 2; //wait before retrying again on upload failure
        
        this.file = file;
        
        this.fileInfo = {
            name: this.file.name,
            type: this.file.type,
            size: this.file.size,
            lastModifiedDate: this.file.lastModifiedDate
        };
        
        this.isPaused = false;
        this.uploadXHR = null;
        this.otherInfo = otherInfo;
        
        this.uploadedSize = 0;
        this.uploadingSize = 0;

        this.curUploadInfo = {
            blob: null,
            partNum: 0
        };
        this.progress = [];
        this.isMultipartUpload = true;

        if (this.file.size <= this.PART_SIZE) {
            this.isMultipartUpload = false;
        }

        this.log = console.log;
    };

    /**
     * Call this function to start uploading to server
     *
     */
    upload.prototype.start = function() {

        this.md5 = new module.ChecksumMD5(this.file);

        var self = this;

        this.md5.hash(function(checksum) {
            self.url = self.SERVER_LOC + "/" + checksum;
            self.fileExists();
        }, function(err) {
            self.onError(new Error((err && err.message) ? 
                                        err.message : 
                                        "Unable to calculate checksum for file " + self.file.name));
        });

    };

    upload.prototype.fileExists = function() {
        var request = new module.HttpRequest({
            url: this.url,
            method: 'GET'   
        });

        request.send(function() {
            self.onUploadCompleted(self.url);
        }, function(status, response, xhr) {
            if (status == 404) {
                if (self.isMultipartUpload) {
                    self.createMultipartUpload(0);
                } else {
                    self.uploadFull();
                }
            } else {
                self.onServerError("ServerError", xhr);
            }
        });
    };


    /** private */
    upload.prototype.createMultipartUpload = function() {
        var self = this;

        var request = new module.HttpRequest({
            url: this.url + ";upload",
            method: 'POST',
            data: {
                "chunk-length" : this.PART_SIZE,
                "content-length": this.file.size,
                "content-type": this.file.type,
                "content-md5": this.md5.checksum,
                "content-disposition": "filename*=UTF-8''" + this.file.name
            },
            headers: [{ key: 'content-type', value: 'application/json' }]
        });

        request.send(function(response, xhr) {
            if (xhr.headers["location"]) {
                self.chunkUrl = xhr.headers["location"]; 
                self.uploadPart(0);
            } else {
                self.onError(new Error("Unable to start chunked Upload"));
            }
        }, function(status, response, xhr) {
            self.onServerError("ServerError", xhr, status, response);
        });

    };


    upload.prototype.uploadFull = function() {

        var xhr = this.uploadXHR = new XMLHttpRequest();
        var self = this;

        xhr.onreadystatechange = function() {
            if (request.readyState === 4) {
                self.uploadXHR = null;
                self.progress[0] = 100;
                if (request.status !== 200) {
                    self.updateProgressBar();
                    if (!self.isPaused)
                        self.onUploadError(request);
                    return;
                }
                self.uploadedSize += blob.size;
                self.updateProgressBar();
            }
        };

        request.upload.onprogress = function(e) {
            if (e.lengthComputable) {
                self.progress[0] = e.loaded / size;
                self.updateProgressBar();
            }
        };
        
        xhr.open("PUT", this.url);

        xhr.setRequestHeader('Content-type', this.file.type);
        xhr.setRequestHeader('Content-MD5', this.md5.checksum);
        xhr.setRequestHeader('Content-Disposition', "filename*=UTF-8''" + this.file.name);

        xhr.send(file);
    };

    /** private */
    upload.prototype.uploadPart = function(partNum) {
        var start = 0;
        var end, blob;

        this.curUploadInfo.partNum = partNum;

        var index = 0

        while (start < this.file.size) {
            start = this.PART_SIZE * this.curUploadInfo.partNum++;
            end = Math.min(start + this.PART_SIZE, this.file.size);
            blob = this.file.slice(start, end);
            this.sendToHatrac(blob, index++);            
        }

    };

    /** private */
    upload.prototype.sendToHatrac = function(blob, index) {
        var self = this;
        var size = blob.size;
        var request = self.uploadXHR = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (request.readyState === 4) {
                self.progress[index] = 100;
                if (request.status !== 200) {
                    self.uploadXHR = null;
                    self.updateProgressBar();
                    if (!self.isPaused)
                        self.onUploadError(request);
                    return;
                }
                self.uploadedSize += blob.size;
                self.updateProgressBar();
            }
        };

        request.upload.onprogress = function(e) {
            if (e.lengthComputable) {
                self.progress[index] = e.loaded / size;
                self.updateProgressBar();
            }
        };
        request.open('PUT', this.chunkUrl + "/" index);
        request.setRequestHeader("content-type", application/octet-stream);
        
        request.send(blob);
    };

    /**
     * Pause the upload
     * Remember, the current progressing part will fail,
     * that part will start from beginning (< 5MB of upload is wasted)
     */
    upload.prototype.pause = function() {
        this.isPaused = true;
        if (this.uploadXHR !== null) {
            this.uploadXHR.abort();
        }
    };

    /**
     * Resumes the upload
     *
     */
    upload.prototype.resume = function() {
        this.isPaused = false;

        if (this.isMultipartUpload) {
            // code to handle reupload
        } else {
            this.start();
        }
    };

    upload.prototype.cancel = function() {
        var self = this;
        self.pause();


        //code to cancel upload
    };

    /** private */
    upload.prototype.completeMultipartUpload = function() {
        var self = this;
        
        var request = new module.HttpRequest({
            url: this.chunkUrl,
            method: 'POST'
        });

        request.send(function(response, xhr) {

            if (xhr.headers["location"]) {
                self.onUploadCompleted(xhr.headers["location"]);
            } else {
                self.onServerError("CompleteChunkUpload", xhr, status, "Unable to start chunked Upload");
            }
            
        }, function(status, response, xhr) {
            self.onServerError("CompleteChunkUpload", xhr, status, response);
        });

    };

    /** private */
    upload.prototype.updateProgressBar = function() {
        var progress = this.progress;
        var length = progress.length;
        var total = 0;
        for (var i = 0; i < progress.length; i++) {
            total = total + progress[i];
        }
        total = total / length;

        this.onProgressChanged(this.uploadingSize, total, this.file.size);

        if (total == 100) {
            this.completeMultipartUpload();
        }
    };

    /**
     * Overrride this function to catch errors occured when communicating to your server
     * If this occurs, the program stops, you can retry by retry() or wait and retry by waitRetry()
     *
     * @param {type} step Name of the step which failed,one of 'CreateChunkUpload', 'CompleteChunkUpload' and 'ServerError'
     * @param {type} xhr
     * @param {type} textStatus resonse text status
     * @param {type} errorThrown the error thrown by the server
     */
    upload.prototype.onServerError = function(command, xhr, textStatus, errorThrown) {};

    /**
     * Overrride this function to catch errors occured when uploading to Hatrac
     *
     * @param XMLHttpRequest xhr the XMLHttpRequest object
     */
    upload.prototype.onUploadError = function(xhr) {};

    /**
     * Override this function to show user update progress
     *
     * @param {type} uploadingSize is the current upload part
     * @param {type} uploadedSize is already uploaded part
     * @param {type} totalSize the total size of the uploading file
     */
    upload.prototype.onProgressChanged = function(uploadingSize, uploadedSize, totalSize) {};

    /**
     * Override this method to execute something when upload finishes
     */
    upload.prototype.onUploadCompleted = function(serverData) {};

    /**
     * Overrride this function to catch errors occured when calculating checksum
     * @param Error err the error object
     */
    upload.prototype.onError = function(err) { };


    module.Upload = upload;

})(hatrac || {});