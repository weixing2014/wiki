var http = require('http'),
    httpProxy = require('http-proxy'), // To create the proxy
    connect = require('connect'),
    jsdom = require('jsdom'), // To parse the categories from the remote server
    url = require('url'),
    request = require('request');

var proxyPort = 8000;   //The port for the interface with categories
var localServerPort = 9000;
var numOfFacetCategories = 50; //The number of the results shown in the category list
var countOfParsingResults = 50; //The number of results that need to be parsed for generating the category list
var sortBy = 'weight'; //The way of sorting out categories, by 'freq' or 'weight'
var databaseHost = "calais.ischool.utexas.edu";
var hostname = "http://localhost:9000";

var facetSearchScript = hostname + "/facetSearchScript.js";
var nonFacetSearchScript = hostname + "/nonFacetSearchScript.js";
var partlyFacetSearchScript = hostname + "/facetSearchScript2.js";
var jQueryScript = hostname + "/jquery-1.10.2.min.js";
var commonScript = hostname + "/common.js";
var jQueryPrompt = hostname + "/jquery-impromptu.js";
var jQTip = hostname + "/jquery.qtip.min.js";

var withCategories = 0;
var userId = 0;
var taskId = 0;
var nthTask = -1;
var taskDescription = "";
var facetSearchElm = "";

function Category() {     // The class of a category
    this.name = "";       //The name of the category
    this.freq = "";       //The frequency of the category appearing beneath the search results
    this.weight = 0;        //The weight of the category
    this.resultDict = [];        //To store all the results that contain this category, the key of the dictionary is the title of the result, the value of the dictionary is a result class
}
function Result() {   //The class of a search result
    this.title = "";   //The title of the search result
    this.rank = 0;     //The rank of the search result
}


function modifyResponseFromWikiST() { // This function is to modify the pages from the remote server

    return function (req, res, next) {    //return a function

        var _write = res.write,
            _writeHead = res.writeHead,
            isHtml = false,
            script = withCategories == 0 ? nonFacetSearchScript : (withCategories == 1 ? facetSearchScript : partlyFacetSearchScript);


        //If the web page comes from wikipedia.searchtechnologies.com and the page is a search result page, then inject the javascript file
        if (req.headers.host.indexOf("wikipedia.searchtechnologies.com") > -1 && req.url.indexOf("/search") > -1) {
            console.log("Response came from wikist, injecting js...");
            s = "<script type='text/javascript' charset='utf-8' src='" + jQueryScript + "'></script><script type='text/javascript' charset='utf-8' src='" + jQueryPrompt + "'></script><script type='text/javascript' charset='utf-8' src='" + jQTip + "'></script><script type='text/javascript' charset='utf-8' src='" + commonScript + "'></script><script type='text/javascript' charset='utf-8' src='" + script + "'></script>"

            // Rewrite the length of the head of a html response

            res.writeHead = function (code, headers) {  //Rewrite the function writeHead
                isHtml = headers['content-type'] && headers['content-type'].match('text/html');
                if (isHtml) {
                    headers['content-length'] = parseInt(headers['content-length']) + s.length;
                    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';   //Force no cache for the page, in case the users press the back button and get the outdated categories
                    headers['Pragma'] = 'no-cache';
                    headers['Expires'] = 0;
                }
                _writeHead.apply(this, arguments);
            }

            // rewrite the body of html file
            res.write = function (chunk) {
                if (isHtml) {
                    chunk = chunk.toString().replace(/(<head>)/, "$1" + s);
                }
                _write.call(res, chunk);
            }

        }

        else if (req.headers.host.indexOf("wikipedia.org") > -1) {
            console.log("Response came from wikipedia.org, injecting js...");
            s = "<script type='text/javascript' charset='utf-8' src='" + jQueryScript + "'></script><script type='text/javascript' charset='utf-8' src='" + jQueryPrompt + "'></script><script type='text/javascript' charset='utf-8' src='" + jQTip + "'></script><script type='text/javascript' charset='utf-8' src='" + commonScript + "'></script><script type='text/javascript' charset='utf-8' src='" + script + "'></script>"

            res.writeHead = function (code, headers) { //Rewrite the function writeHead
                isHtml = headers['content-type'] && headers['content-type'].match('text/html');// If the file is a html file then modify header's length, adding the length of the javascript file that is going to inject to the html
                if (isHtml) {
                    headers['content-length'] = parseInt(headers['content-length']) + s.length;
                    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';   //Force no cache for the page, in case the users press the back button and get the outdated categories
                    headers['Pragma'] = 'no-cache';
                    headers['Expires'] = 0;
                }
                _writeHead.apply(this, arguments);
            }
            res.write = function (chunk) { //Rewrite the function write

                if (isHtml) {
                    chunk = chunk.toString().replace(/(<head>)/, "$1" + s);
                }
                _write.call(res, chunk);
            }

        }

        else if (req.headers.host.indexOf("calais.ischool.utexas.edu") <= -1) {

            s = "<script type='text/javascript' charset='utf-8' src='" + jQueryScript + "'></script><script type='text/javascript' charset='utf-8' src='" + jQueryPrompt + "'></script><script type='text/javascript' charset='utf-8' src='" + jQTip + "'></script><script type='text/javascript' charset='utf-8' src='" + commonScript + "'></script>"


            res.writeHead = function (code, headers) { //Rewrite the function writeHead

                isHtml = headers['content-type'] && headers['content-type'].match('text/html');// If the file is a html file then modify header's length, adding the length of the javascript file that is going to inject to the html
                if (isHtml) {
                    headers['content-length'] = parseInt(headers['content-length']) + s.length;
                    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';   //Force no cache for the page, in case the users press the back button and get the outdated categories
                    headers['Pragma'] = 'no-cache';
                    headers['Expires'] = 0;
                }
                _writeHead.apply(this, arguments);
            }
            res.write = function (chunk) { //Rewrite the function write

                if (isHtml) {
                    chunk = chunk.toString().replace(/(<head>)/, "$1" + s);
                }
                _write.call(res, chunk);
            }

        }
        next();
    }
}

function parseCategories(window, url) {   //Parse the search result page from wikipedia.searchtechnologies.com getting by jsdom, in order to build a category list for the current query
    console.log("Parsing categories...");

    var $ = window.$; //Get a jQuery instance of the window
    $body = $('body').eq(0).clone(); //Clone the body, then we can play with $body in the local proxy rather than playing the data on the remote server
    $categoryNodes = $body.find(".search-field.capsule.f_categories"); //Find all the nodes with such a class. $categoryNodes is a list storing the information of all categories beneath the results on the page.
    //This is the html of a category under a search result: <div class="search-field capsule f_categories"><p class="value"><a href="?q=thailand&amp;mq=thailand&amp;f=f_categories%5B%22Constitutional+monarchies%22%5D">Constitutional monarchies</a></p></div>
    var lengthOfCategoryNodes = $categoryNodes.length;  //Get the number of the categories


    var categoryDict = {}; //A dictionary, or say a hash map, to store the instances of all categories, the internal format is like {"<category1's name>": the instance of category1, "<category2's name>": the instance of category2, ... }
    var categoryArray = [];//An Array to store the instances of all categories in order, either by frequency or by weight

    for (i = 0; i < lengthOfCategoryNodes; i++) { //Check every category node and then convert it to a category instance and put it in the category dictionary
        var tempCategoryName = $categoryNodes.eq(i).text().trim();  // Get the name of the current category
        $tempResultNode = $categoryNodes.eq(i).parents("li");       //Get the html node of the result of the current category
        var tempResultRank = $tempResultNode.attr('class').split(' ')[1].substring(5).trim();//Get the rank of the result
        //sample code: <li class="result item_2 even">
        var tempResultTitle = $tempResultNode.find("b>a").eq(0).text().trim();//Get the title of the result
        //sample code: <b class="value"><a href="http://en.wikipedia.org/wiki/Prime_Minister_of_Thailand">Prime Minister of Thailand</a></b>

        if (!categoryDict.hasOwnProperty(tempCategoryName)) {//If current category is not in the category dictionary, add it in
            var tempCategory = new Category();

            tempCategory.freq = 1;
            tempCategory.name = tempCategoryName;
            tempCategory.weight += countOfParsingResults + 1 - tempResultRank;

            //tempCategory.resultDict[tempResultTitle] = tempResultRank;
            var resultTemp = new Result();
            resultTemp.rank = tempResultRank;
            resultTemp.title = tempResultTitle;
            tempCategory.resultDict.push(resultTemp);
            categoryDict[tempCategory.name] = tempCategory;
        }
        else { //If current category is in the category dictionary, recalculate the frequency & weight of the category
            categoryDict[tempCategoryName].freq++;
            categoryDict[tempCategoryName].weight += countOfParsingResults - tempResultRank + 1;
            categoryDict[tempCategoryName].resultDict[tempResultTitle] = tempResultRank;
            var resultTemp = new Result();  // create a new result instance
            resultTemp.rank = tempResultRank;
            resultTemp.title = tempResultTitle;
            categoryDict[tempCategoryName].resultDict.push(resultTemp);// add the result in the result dictionary of current category
        }
    }

    var tempCategory = new Category();

    for (var category in categoryDict) {  //move the category instances from category dictionary to category array for the further sorting
        categoryArray.push(categoryDict[category]);
    }

    if (categoryArray.length > 0) {
        if (sortBy == 'freq') {    //sort by frequency of the categories
            categoryArray.sort(function (a, b) {
                return b.freq - a.freq;
            });
        }

        else if (sortBy == 'weight') {  //sort by weight of teh categories
            categoryArray.sort(function (a, b) {
                return b.weight - a.weight;
            });
        }
    }


    console.log("Creating category bar...");

    //Build html of the category list as below
    $tempUl = $("ul:nth-child(2)").clone();
    $tempUl.find("li dl dd").remove();
    $tempUl.find("li div").remove();
    $tempUl.find("#f_categories").attr("id", "#f_new_categories");
    for (var i = 0; i < (categoryArray.length < numOfFacetCategories ? categoryArray.length : numOfFacetCategories); i++) {
        $tempDd = $('<dd></dd>').addClass("filter frequency-1  even");
        $tempA = $('<a></a>').text(categoryArray[i].name).addClass("label").attr({"href": url.concat('&f=f_categories%5B"').concat(categoryArray[i].name.replace(/\s+/g, '+').concat('"%5D')), "title": categoryArray[i].name});
        $tempSpan = $('<span></span>').addClass("metadata").append(($('<span></span>').text(sortBy == 'freq' ? categoryArray[i].freq : (sortBy == 'weight' ? categoryArray[i].weight : '')).addClass('count')));
        $tempAMinus = $('<a></a>').text('-').addClass("exclude").attr({"href": url.concat('&f=-f_categories%5B"').concat(categoryArray[i].name.replace(/\s+/g, '+').concat('"%5D')), "title": 'not '.concat(categoryArray[i].name)});
        $tempAPlus = $('<a></a>').text('+').addClass("include").attr({"href": url.concat('&f=f_categories%5B"').concat(categoryArray[i].name.replace(/\s+/g, '+').concat('"%5D'))});
        $tempDd.append($tempA).append($tempSpan).append($tempAMinus).append($tempAPlus);
        $tempUl.find("li dl").append($tempDd);
        $tempUl.find(".label").css({"width": "75%"});
        $tempUl.find(".metadata").css({"backgroundColor": '#f7f7f7', "width": '12%'});
    }

    $tempUl.find("dt").remove();
    facetSearchElm = $tempUl.find('dl').wrap('<p>').parent().html();
    console.log("Done...");
}

httpProxy.createServer(modifyResponseFromWikiST(),function (req, res, proxy) {

    var urlObj = url.parse(req.url);
    req.headers.host = urlObj.host;   //Get the host of the website from the user request
    req.url = urlObj.path;         //Get the url of the web page from the user request

    console.log("url:" + req.url);

    //save element coordinates
//    if (req.url.indexOf("time") > -1 && req.url.indexOf("url") > -1 && req.url.indexOf("left") > -1 && req.url.indexOf("top") > -1 && req.url.indexOf("right") > -1 && req.url.indexOf("bottom") > -1) {//If the request is sending the inates of the elements on web pages
//        delete req.headers['accept-encoding'];   // Force decrypt the content of the web page that is going to response from the remote server
//        req.headers.host = databaseHost;
//    }

    if (getParameterByName("proxyReq", req.url) != null) {
        console.log("Proxy is taking care of a request...")
        if (getParameterByName("proxyReq", req.url).indexOf("addAction") > -1) {
            console.log("Insert an action into database...");
            request({uri: "http://calais.ischool.utexas.edu/insertActionsInDB.php?userId=" + userId + "&taskId=" + taskId + "&actionType=" + getParameterByName("actionType", req.url)+ "&actionDescription=" + getParameterByName("actionDescription", req.url) + "&time=" + encodeURI(_getTime(parseInt(getParameterByName("milliseconds", req.url)))) + "&url=" + getParameterByName("url", req.url) + "&milliseconds=" + getParameterByName("milliseconds", req.url), method: "GET", dataType: 'json'}, function (error, response, body) {
                res.writeHead(200, {"Content-Type": "application/json", "Cache-Control": 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': 0});
                res.end(body);
            });
        }
        else if(getParameterByName("proxyReq", req.url).indexOf("addCoord")>-1){
                console.log("Insert an element coordinate into database...");
                request({uri: "http://calais.ischool.utexas.edu/insertCoordsInDB.php?userId=" + userId + "&taskId=" + taskId + "&t=" + getParameterByName("t", req.url)+ "&f=" + getParameterByName("f", req.url)+ "&n=" + getParameterByName("n", req.url) + "&i=" + getParameterByName("i", req.url) + "&c=" + getParameterByName("c", req.url)+ "&left=" + getParameterByName("left", req.url)+ "&top=" + getParameterByName("top", req.url)+ "&right=" + getParameterByName("right", req.url)+ "&bottom=" + getParameterByName("bottom", req.url)+ "&f=" + getParameterByName("f", req.url)+ "&actionId=" + getParameterByName("actionId", req.url)+ "&actionType=" + getParameterByName("actionType", req.url)+ "&verticalChange=" + getParameterByName("verticalChange", req.url)+ "&time=" + encodeURI(_getTime(parseInt(getParameterByName("milliseconds", req.url)))) + "&url=" + getParameterByName("url", req.url) + "&milliseconds=" + getParameterByName("milliseconds", req.url), method: "GET", dataType: 'json'}, function (error, response, body) {
                    res.writeHead(200, {"Content-Type": "application/json", "Cache-Control": 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': 0});
                    res.end(body);
                });
        }
        else if (getParameterByName("proxyReq", req.url).indexOf("updateBookmarks") > -1) {

            console.log("Update bookmarks...")
            var body = '';
            req.on('data', function (data) {
                body += data;
            });
            req.on('end', function () {
                var tempBookMarks = JSON.parse(body);
                console.log("Get bookmarks from database...");
                console.log(tempBookMarks);
                var options = {
                    uri: 'http://calais.ischool.utexas.edu/updateBookmarks.php',
                    method: 'POST',
                    json: tempBookMarks
                };
                request(options, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        res.writeHead(200, {'content-type': 'text/plain' });
                        res.end()
                    }
                });
            });
        }
        else if (getParameterByName("proxyReq", req.url).indexOf("resetUserInfoByUserId") > -1) {
            userId = getParameterByName("userId", req.url);
            resetUserInfoByUserId(userId);
            //Get Json from the database
            resetId = setInterval(function () {
                if (taskId > -1) {
                    clearInterval(resetId);
                    var object = {"success": 1};
                    var json = JSON.stringify(object);
                    res.end(json);
                }
            }, 200);
        }
        else if (getParameterByName("proxyReq", req.url).indexOf("setTaskNote") > -1) {
            console.log(encodeURI(getParameterByName('note', req.url)));
            request({uri: "http://calais.ischool.utexas.edu/setTaskNote.php?userId=" + getParameterByName('userId', req.url) + "&taskId=" + getParameterByName('taskId', req.url) + "&url=" + getParameterByName('url', req.url) + "&note=" + encodeURI(getParameterByName('note', req.url)), method: "GET", dataType: 'json'}, function (error, response, body) {
                res.writeHead(200, {"Content-Type": "application/json", "Cache-Control": 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': 0});
                res.end(body);
            });
        }

        else if (getParameterByName("proxyReq", req.url).indexOf("getTaskInfo") > -1) {
            console.log("Get task info...");
            console.log("task id: " + taskId);
            console.log("user id: " + userId);
            console.log("task #: " + nthTask);
            console.log("task description: " + taskDescription);

            res.writeHead(200, {"Content-Type": "application/json"});
            var object = { "userId": userId, "taskId": taskId, "withCategories": withCategories, "taskDescription": taskDescription, "nthTask": nthTask};
            var json = JSON.stringify(object);
            res.end(json);

        }

        else if (getParameterByName("proxyReq", req.url).indexOf("getBookMarkList") > -1) {
            request({uri: "http://calais.ischool.utexas.edu/getBookMarksByUserAndTaskIds.php?userId=" + getParameterByName('userId', req.url) + "&taskId=" + getParameterByName('taskId', req.url), method: "GET", dataType: 'json'}, function (error, response, body) {
                res.writeHead(200, {"Content-Type": "application/json", "Cache-Control": 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': 0});
                res.end(body);
            });
        }

        else if (getParameterByName("proxyReq", req.url).indexOf("getUserInfo") > -1) {
            request({uri: "http://calais.ischool.utexas.edu/getUserInfoByUserId.php?userId=" + userId, method: "GET", dataType: 'json'}, function (error, response, body) {
                res.writeHead(200, {"Content-Type": "application/json", "Cache-Control": 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': 0});
                res.end(body);
            });
        }

        else if (getParameterByName("proxyReq", req.url).indexOf("taskPlusOne") > -1) {
            request({uri: "http://calais.ischool.utexas.edu/nthTaskPlusOne.php?userId=" + userId, method: "GET", dataType: 'json'}, function (error, response, body) {
                resetUserInfoByUserId(userId);
                res.writeHead(200, {"Content-Type": "application/json", "Cache-Control": 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': 0});
                res.end(body);
            });
        }
        else if (getParameterByName("proxyReq", req.url).indexOf("newCategories") > -1) {  //If the request is from a modified search result page for the data of the category list

            if (getParameterByName("p", req.url) == null || getParameterByName("p", req.url) < 2) {
                facetSearchElm = "";
                var u = decodeURI(getParameterByName("url", req.url));
                u = u + '&rpp=' + countOfParsingResults;
                if (getParameterByName('mq', u) == null) {
                    u = u + '&mq=' + getParameterByName('q', req.url).replace(' ', '+');
                }
                jsdom.env(      //Use jsdom to send a request for wikipedia.searchtechnologies so as to parse and build the category list
                    u,
                    [jQueryScript],
                    function (errors, window) {
                        parseCategories(window, u); //Start to parse
                    }
                );
            }

            var sid = setInterval(function () {
                if (facetSearchElm.length > 0) {
                    clearInterval(sid);
                    res.writeHead(200, {'Content-Type': 'text/html'}); //Specify the content type
                    res.end(facetSearchElm);  //Send the category list to the search result page in front of the user right now
                }
            }, 200);
        }
    }

    else {
        delete req.headers['accept-encoding']; // Force decrypt the content of the web page that is going to response from the remote server
        proxy.proxyRequest(req, res, {  //Send the request to the web site
            host: req.headers.host,
            port: 80,
            enable: {xforward: true }
        });
    }

}).listen(proxyPort, function () {   //Listen to the port of the client that hopes to get a search result page with a category list
        console.log("Waiting for requests...");
    });


connect.createServer(
    connect.static(__dirname)
).listen(localServerPort);

function resetUserInfoByUserId(userId) {

    request({uri: "http://calais.ischool.utexas.edu/getNextTaskByUserId.php?userId=" + userId, method: "GET", dataType: 'json'}, function (error, response, body) {

        if (JSON.parse(body)[0] != null) {
            taskId = JSON.parse(body)[0]["taskId"];
            withCategories = JSON.parse(body)[0]["withCategories"];
            taskDescription = JSON.parse(body)[0]["taskDescription"];
            nthTask = JSON.parse(body)[0]["nthTask"];
            return {"taskId": JSON.parse(body)[0]["taskId"], withCategories: JSON.parse(body)[0]["withCategories"], taskDescription: JSON.parse(body)[0]["taskDescription"]};

        }
        else {
            taskId = -1;
            withCategories = -1;
            taskDescription = "";
            nthTask = -1;
            return {};
        }
    });


}

function getParameterByName(name, url) {  //Parse the parameters in a URL
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(url);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function _getTime(time) {
    var d = new Date(time);
    var currentTime = new Date().toLocaleString();
    currentTime = currentTime.substring(0, currentTime.length - 3).concat("." + d.getMilliseconds()).concat(currentTime.substring(currentTime.length - 3, currentTime.length));
    return currentTime;
}