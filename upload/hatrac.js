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

        var xhr = new XMLHttpRequest();

        this.xhr = xhr;

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
          var key = headerPair.substring(0, index).toLowerCase();
          var val = headerPair.substring(index + 2);
          headers[key] = val;
        }
      }
      return headers;
    };

    module.HttpRequest.prototype.send = function(onSuccess, onError) {

        var request = this.request, self = this;

        if (!onSuccess || !(typeof onSuccess == 'function')) onSuccess = function() {};
        if (!onError || !(typeof onError == 'function')) onError = function() {};

        this.xhr.onreadystatechange = function() {
            if (self.xhr.readyState == 4) {
                self.xhr.headers = parseResponseHeaders(self.xhr.getAllResponseHeaders());
                var response = self.xhr.responseText;
                if ((self.xhr.status >= 200 && self.xhr.status < 300) || self.xhr.status == 304) {
                    onSuccess(response, self.xhr);
                } else {
                    onError(self.xhr.status, response, self.xhr);
                }
            }
        };

        this.xhr.open(request.method, request.url, request.sync ? false : true);

        for (var x = 0; x < request.headers.length; x += 1)
            this.xhr.setRequestHeader(request.headers[x].key, request.headers[x].value);

        this.xhr.send(request.data);

        return this.xhr;
    };
})(hatrac || {});

(function(module) {

    var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;

    if (!window.atob) {
        var tableStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var table = tableStr.split("");

        window.atob = function (base64) {
            if (/(=[^=]+|={3,})$/.test(base64)) throw new Error("String contains an invalid character");
            base64 = base64.replace(/=/g, "");
            var n = base64.length & 3;
            if (n === 1) throw new Error("String contains an invalid character");
            for (var i = 0, j = 0, len = base64.length / 4, bin = []; i < len; ++i) {
                var a = tableStr.indexOf(base64[j++] || "A"), b = tableStr.indexOf(base64[j++] || "A");
                var c = tableStr.indexOf(base64[j++] || "A"), d = tableStr.indexOf(base64[j++] || "A");
                if ((a | b | c | d) < 0) throw new Error("String contains an invalid character");
                bin[bin.length] = ((a << 2) | (b >> 4)) & 255;
                bin[bin.length] = ((b << 4) | (c >> 2)) & 255;
                bin[bin.length] = ((c << 6) | d) & 255;
            };
            return String.fromCharCode.apply(null, bin).substr(0, bin.length + n - 4);
        };

        window.btoa = function (bin) {
            for (var i = 0, j = 0, len = bin.length / 3, base64 = []; i < len; ++i) {
                var a = bin.charCodeAt(j++), b = bin.charCodeAt(j++), c = bin.charCodeAt(j++);
                if ((a | b | c) > 255) throw new Error("String contains an invalid character");
                base64[base64.length] = table[a >> 2] + table[((a << 4) & 63) | (b >> 4)] +
                                      (isNaN(b) ? "=" : table[((b << 2) & 63) | (c >> 6)]) +
                                      (isNaN(b + c) ? "=" : table[c & 63]);
            }
            return base64.join("");
        };

    }

    var checkHex = function(n) {
        return/^[0-9A-Fa-f]{1,64}$/.test(n)
    };

    var Hex2Bin = function(n) { 
        if (!checkHex(n)) return 0;
        return parseInt(n,16).toString(2); 
    };

    var hexToBase64 = function (str) {
      return btoa(String.fromCharCode.apply(null,
        str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" "))
      );
    }

    var Checksum = function(file, options) {
        this.file = file;
        this.options = options || {};
    };

    Checksum.prototype.calculate = function(onProgress, onSuccess, onError) {

        var self = this, file = this.file;
        if (!onProgress || !(typeof onProgress == 'function')) onProgress = function() {};
        if (!onSuccess || !(typeof onSuccess == 'function')) onSuccess = function() {};
        if (!onError || !(typeof onError == 'function')) onError = function() {};


        // If checksum is already calculated then don't calculate it again
        if (this.checksum) {
            onProgress(this.file.size, this.file.size);
            onSuccess(this.checksum, this);
            return
        }


        var chunkSize = 50 * 1024 * 1024, // read in chunks of 5MB
        chunks = Math.ceil(file.size / chunkSize),
        currentChunk = 0,
        spark = new SparkMD5.ArrayBuffer();

        var onLoad = function(e) {
            console.log("\nRead chunk number " + parseInt(currentChunk + 1) + " of " + chunks);
            spark.append(e.target.result); // append array buffer
            currentChunk++;
            
            onProgress(chunkSize * currentChunk ,file.size);

            if (currentChunk < chunks)
                loadNext();
            else {
                self.checksum = spark.end();
                self.md5 = hexToBase64(self.checksum);
                console.log("\nFinished loading :)\n\nComputed hash: " + self.checksum + "\n\nComputed Checksum: "  + self.md5 + "\n!");
                onSuccess(self.checksum, self);
            }
        };
        
        var loadNext = function () {
            var fileReader = new FileReader();
            fileReader.onload = onLoad;
            fileReader.onerror = onError;
            var start = currentChunk * chunkSize,
                end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;
            fileReader.readAsArrayBuffer(blobSlice.call(self.file, start, end));
        };
        
        loadNext();
    };

    module.Checksum = Checksum;

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
        
        this.PART_SIZE = 50 * 1024 * 1024; //minimum part size defined by hatrac 50MB

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
        this.otherInfo = otherInfo;
        
        this.uploadedSize = 0;
        this.uploadingSize = 0;

        this.chunks = [];
        this.isMultipartUpload = true;

        if (this.file.size <= this.PART_SIZE) {
            this.isMultipartUpload = false;
        }

        this.log = console.log;
    };

    /** private
     * Call this function to determine file exists on the server
     * If it doesn't then upload process will begin 
     * Depending on file size it is either uploaded in chunks or fully
     *
     */
    upload.prototype.fileExists = function() {
        var self = this;

        var request = new module.HttpRequest({
            url: this.url,
            method: 'HEAD'   
        });

        request.send(function() {
            self.completed = true;
            self.onProgressChanged(self.file.size, self.file.size);
            self.onUploadCompleted(self.url);
        }, function(status, response, xhr) {
            if (status == 404 || status == 409) {
                if (self.isMultipartUpload) {
                    self.createMultipartUpload();
                } else {
                    self.uploadFull();
                }
            } else {
                self.onServerError("ServerError", xhr);
            }
        });
    };

    /** private 
     * Call this function to create multipart request to ermrest
     * It will generate a chunkupload identifier by calling ermrest and set it in the chunkUrl
     */
    upload.prototype.createMultipartUpload = function() {
        var self = this;

        var request = new module.HttpRequest({
            url: this.url + ";upload?parents=true",
            method: 'POST',
            data: {
                "chunk-length" : this.PART_SIZE,
                "content-length": this.file.size,
                "content-type": this.file.type,
                "content-md5": this.hash.md5,
               // "content-sha256": encodeURIComponent(this.hash.sha),
                "content-disposition": "filename*=UTF-8''" + this.file.name
            },
            headers: [{ key: 'content-type', value: 'application/json' }]
        });

        request.send(function(response, xhr) {
            if (xhr.headers["location"]) {
                self.chunkUrl = xhr.headers["location"]; 
                self.startMultipartUpload();
            } else {
                self.onError(new Error("Unable to start chunked Upload"));
            }
        }, function(status, response, xhr) {
            self.onServerError("ServerError", xhr, status, response);
        });

    };

     /** private
     * Call this function to start multipart upload to server
     *
     */
    upload.prototype.startMultipartUpload = function(isResume) {
        var self = this;

        // If isResume is nor true, then create chunks and start uploading
        // else directly start uploading the chunks
        if (!isResume) {
            var start = 0;
            var blob;
            var index = 0;
            this.chunks = [];
            while (start < this.file.size) {
                end = Math.min(start + this.PART_SIZE, this.file.size);
                var chunk = new Chunk(index++, start, end);
                self.chunks.push(chunk)
                start = end;          
            }
        }
 
        var part = 0;
        this.chunks.forEach(function(chunk) {
            chunk.retryCount = 0;
            self.uploadPart(chunk);
            part++
        });
    };


    /** private
     * Call this function to start uploading to server without chunking
     *
     */
    upload.prototype.uploadFull = function() {
        var chunk = new Chunk(-1, 0, this.file.size);
        this.chunks = [chunk];
        chunk.sendToHatrac(this);
    };

    /** private
    
     */
    upload.prototype.uploadPart = function(chunk) {

        if (chunk.completed) {
            this.updateProgressBar();
            return;
        } else if (chunk.xhr && !chunk.completed) {
            if (chunk.xhr) chunk.xhr.abort();
            chunk.xhr = null;
            chunk.progress = 0;
        }

        chunk.sendToHatrac(this);
    };

    /** private 
     *  This function is used to complete the chunk upload by notifying hatrac about it and calls 
     *  onUploadCompleted with final url
     *  else call serverError to notify about the error
     */
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
                self.onServerError("CompleteChunkUpload", xhr, status, "Unable to end chunked Upload");
            }
            
        }, function(status, response, xhr) {
            self.onServerError("CompleteChunkUpload", xhr, status, response);
        });

    };

    /** private 
     * This function should be called to update the progress of upload
     * It calls the onProgressChanged callback that the user subscribes
     * In addition if the upload has been combleted then it will call onUploadCompleted for regular upload
     * and completeMultipartUpload to complete the chunk upload
     */
    upload.prototype.updateProgressBar = function() {
        var length = this.chunks.length;
        var done = 0;
        for (var i = 0; i < this.chunks.length; i++) {
            done = done + this.chunks[i].progress;
        }
       
        this.onProgressChanged(done, this.file.size);

        if (done >= this.file.size && !this.completed) {
            this.completed = true;
            if (this.isMultipartUpload) {
                this.completeMultipartUpload();
            } else {
                this.onUploadCompleted(this.url);
            }
        }
    };

    /**
     * Call this function to start uploading to server
     * 1. It will first calculate the checksum for the file
     * 2. Second it will check whether the file exists
     *
     */
    upload.prototype.start = function() {

        if (this.completed) {
            this.updateProgressBar();
            this.onUploadCompleted();
            return;
        }

        if (!this.hash) {
            this.hash = new module.Checksum(this.file);
        }

        var self = this;
        this.hash.calculate(this.onChecksumProgressChanged, function(checksum) {
            self.url = self.SERVER_LOC + "/" + checksum;
            self.fileExists();
        }, function(err) {
            self.onError(new Error((err && err.message) ? 
                                        err.message : 
                                        "Unable to calculate checksum for file " + self.file.name));
        });

    };

     /**
     * Pause the upload
     * Remember, the current progressing part will fail,
     * that part will start from beginning (< 50MB of upload is wasted)
     */
    upload.prototype.pause = function() {

        if(this.completed || this.isPaused) return;

        this.isPaused = true;
        this.chunks.forEach(function(chunk) {
            if (chunk.xhr) chunk.xhr.abort();
            chunk.xhr = null;
            if (!chunk.completed) chunk.progress = 0;
        });
        this.updateProgressBar();
    };

    /**
     * Resumes the upload
     *
     */
    upload.prototype.resume = function() {
        if (!this.isPaused) return;

        this.isPaused = false;

        if (this.isMultipartUpload) {
            // code to handle reupload
            this.startMultipartUpload(true);
        } else {
            this.start();
        }
    };

    /**
     * Aborts/cancels the upload
     *
     */
    upload.prototype.cancel = function() {
        if (this.completed) return;

        var self = this;
        this.isPaused = true;
        this.completed = false;

        this.chunks.forEach(function(chunk) {
            if (chunk.xhr) chunk.xhr.abort();
            chunk.xhr = null;
            chunk.progress = 0;
            chunk.completed = false;
        });
        this.updateProgressBar();
        //code to cancel upload

        if (this.isMultipartUpload) {

            // This request will fire asynchronously
            (new module.HttpRequest({
                url: this.chunkUrl,
                method: 'DELETE'
            })).send();
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
     * Private
     * Call this function with error response in case of upload failures (status code 400 - 500)
     * Depending on whether an erred is false, error callback is raised
     * This check is done to avoid problems with err callback getting called multiple times in case of chunks
     *
     * @param XMLHttpRequest xhr the XMLHttpRequest object
     */
    upload.prototype.onUploadInternalError = function(xhr) {
        if (!this.erred) {
            this.erred = true;
            this.onUploadError(xhr);
        }
    };

    /**
     * Overrride this function to catch errors occured when uploading to Hatrac
     *
     * @param XMLHttpRequest xhr the XMLHttpRequest object
     */
    upload.prototype.onUploadError = function(xhr) { };

    /**
     * Override this function to show user checksum update progress
     *
     * @param {type} readSize is the current part of the file that has been read uptil now
     * @param {type} totalSize the total size of the uploading file
     */
    upload.prototype.onChecksumProgressChanged = function(readSize, totalSize) {};


    /**
     * Override this function to show user update progress
     *
     * @param {type} uploadingSize is the current upload part
     * @param {type} totalSize the total size of the uploading file
     */
    upload.prototype.onProgressChanged = function(uploadingSize, totalSize) {};

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

    var Chunk = function(index, start, end) {
        this.index = index;
        this.start = start
        this.end = end
        this.completed = false;
        this.xhr = null;
        this.progress = 0;
        this.size = end-start;
        this.retryCount = 0;
    };

    /** private 
     * This function will upload file/blob to the url
     * If the index is -1, then the upload is direct else it is chunked upload
     */
    Chunk.prototype.sendToHatrac = function(upload) {

        if (this.xhr || this.completed) {
            self.progress = this.size;
            upload.updateProgressBar();
            return;
        }

        var self = this;

        // If index is -1 then blob is the file else it is the 
        // sliced version of the file from start and end index
        var blob = (this.index == -1) ? upload.file : upload.file.slice(this.start, this.end);
        var size = blob.size;
        this.progress = 0;
       
        var headers = [];

        // Set content md5,type and disposition headers if index is -1 i.e the upload is direct
        // else set content-type to "application/octet-stream"
        if (this.index == -1) {
          headers.push({ key: 'Content-type', value: upload.file.type });
          headers.push({ key: 'Content-MD5', value: upload.hash.md5 });
          headers.push({ key: 'Content-Disposition', value: "filename*=UTF-8''" + encodeURIComponent(upload.file.name) });
        } else {
          headers.push({ key: "content-type", value: "application/octet-stream" });
        }

        var request = new module.HttpRequest({
            // If index is -1 then upload it to the url or upload it to chunkUrl
            url: (this.index == -1) ? (upload.url  + "?parents=true") : (upload.chunkUrl + "/" + this.index),
            method: "PUT",                      
            headers: headers,
            data: blob
        });

        self.xhr = request.xhr;

        // To track progress on upload
        self.xhr.upload.onprogress = function(e) {
            if (e.lengthComputable) {
                self.progress = e.loaded;
                upload.updateProgressBar();
            }
        };  

        // Send the request
        // If upload is aborted using .abort() for pause or cancel scenario
        // then error callback will be called for which the status code would be 0
        // else it would be in range of 400 and 500
        request.send(function() {
            
            // Set progress to blob size, and set chunk completed
            self.progress = self.size;
            self.completed = true;
            self.xhr = null;
            
            upload.updateProgressBar();
        }, function(status, message, xhr) {
            self.progress = 0;
            
            // If upload is not paused 
            // and the status code is in range of 500 then there is a server error, keep retrying for 5 times
            // else the error is in 400 series which is some client error
            if (!upload.isPaused) {
                if (status >= 500 && self.retryCount < 5) {
                    self.retryCount++;
                    self.sendToHatrac(upload);
                } else {
                    upload.updateProgressBar();
                    upload.onUploadInternalError(xhr);
                }
            } else {
                upload.updateProgressBar();
            }
        });

       
    };

})(hatrac || {});