
var blacklist = ["article"];  //Filter out the categories starting with the words in the blacklist
var maxCategoryNumOfEachResult = 10;
var scrollTop = 0;//Get the Y axis of the current page
var mainArray = new Array();
var userId;
var taskUIId;
var withCategories;// the appearance of the categories on the wikipedia.searchtechnologies.com search result page
var taskDescription;
var nthTask;// The number of current task
var bookmarkList = [];
var verticalChange;
var actionType;
var taskNum = 5;
var databaseHostname = "http://calais.ischool.utexas.edu";

//resolve html tag, which is more dominant than <body>
var html;
var closeAfterDone=true; //Close the Web page automatically after the user submits the final note



if (document.documentElement) {
    html = $(document.documentElement); //just drop $ wrapper if no jQuery
} else if (document.getElementsByTagName('html') && document.getElementsByTagName('html')[0]) {
    html = $(document.getElementsByTagName('html')[0]);
} else if ($('html').length > -1) {//drop this branch if no jQuery
    html = $('html');
} else {
    console.log('no html tag retrieved...!');
}

//position
if (html.css('position') === 'static') { //or
    html.css('position', 'relative');//or use .style or setAttribute
}

//top (or right, left, or bottom) offset
var currentLeft = html.css('left');//or
if (currentLeft === 'auto') {
    currentTop = 0;
} else {
    currentLeft = parseFloat($('html').css('Left')); //parseFloat removes any 'px' and returns a number type
}

html.css(
    'left',     //move the elements of a Web page to the right, in order to insert the bookmark sidebar on the left
     '240px'
);

// The bookmark sidebar iFrame id
var iframeId = 'theSidebar';
if (document.getElementById(iframeId)) {
    console.log('id:' + iframeId + 'taken please dont use this id!');
}


//The bookmark sidebar is actually a iFrame
//below are creating bookmark sidebar iFrame by jQuery
html.append($("<iframe id='theSidebar' scrolling='no' frameborder='0' allowtransparency='false' style='position:fixed; width: 240px; border:none; z-index: 15; top: 0px; height: 100%; right:0px; left:0px;'/>"));
document.write("<link rel='stylesheet' href='http://localhost:9000/common.css' type='text/css'>");
//


//If the Web page is a wikipedia.searchtechnologies.com search result page
//Hide or remove the HTML element we don't need in the experiment
if (location.hostname.indexOf("searchtechnologies") > -1) {
    //Adjust the page layout

    document.write("<style type='text/css'> .result-count-toggle{display:none;} #results>div{display:none;} .toggle-controls{display:none;} </style>");

    $('.toggle-controls').remove();
    $('.toggle-panes').remove();
    $('.result-count-toggle').remove();
}

//If the Web page is a wikipedia.org content page
//Modify some elements and
//Add names for the elements whose coordinates need to be stored

else if (location.hostname.indexOf(".wikipedia.org") > -1) {
    //Hide the searchbox
//    document.write("<style type='text/css'> #p-search { display:none;} </style>");

    $(document).ready(function () {

        $("#searchInput").remove();
        $("#simpleSearch").prepend($("<input id='searchbox' type='text' style='font-size: 17px'>"));

        $("#searchform").submit(function( event ) {
            if(event.preventDefault) event.preventDefault();
            if($("#searchbox").val().length>0){

                location.href="http://wikipedia.searchtechnologies.com/search?q="+$("#searchbox").val().replace(' ','+');
            }
            else
            alert( "The search input cannot be null!" );
        });

        $("#firstHeading").attr({name: "1st_level_heading"});
        $("#bodyContent h2:has(>span)").each(function (index) {
            $(this).attr({name: "2nd_level_heading", id: "2nd_level_heading_" + $(this).text()});
        });
        $("#mw-panel").attr({name: "left_sidebar"});
        $("#toc").attr({name: "contents_panel"});
        $(".infobox").eq(0).attr({name: "right_infobox"});
        $(".wikitable").each(function (index) {
            $(this).attr({name: "wiki_table", id: "wiki_table_" + (index + 1)});
        });

        for (var i = 0; i < $("h2").length; i++) {
            $("h2[name='2nd_level_heading']").eq(i).nextUntil($("h2[name='2nd_level_heading']").eq(i+1)).wrapAll("<div name='2nd_level_heading_content' id='2nd_level_heading_content_" + $("h2[name='2nd_level_heading']").eq(i).text().split(' ').join('_') + "'></div>");
        }

        for(var i=0; i<$("div[name='2nd_level_heading_content']").length; i++){
            for(var j=0; j<$("div[name='2nd_level_heading_content']:eq("+i+")>p").length; j++){
                $("div[name='2nd_level_heading_content']:eq("+i+")>p").eq(j).attr({"name":"2nd_level_heading_content_p","id":$("div[name='2nd_level_heading_content']").eq(i).attr("id")+"_p_"+(j+1)});
            }
            for(var j=0; j<$("div[name='2nd_level_heading_content']:eq("+i+") .thumb").length; j++){
                $("div[name='2nd_level_heading_content']:eq("+i+") .thumb").eq(j).attr({"name":"2nd_level_heading_content_thumb","id":$("div[name='2nd_level_heading_content']").eq(i).attr("id")+"_thumb_"+(j+1)});
            }
        }



    });
}

//Right after the Web page is loaded
$(document).ready(function () {



    //disable ctrl+f
    window.addEventListener("keydown",function (e) {
        if ((e.ctrlKey && e.keyCode === 70)||(e.command && e.keyCode === 70)) {
            if(e.preventDefault) e.preventDefault();
        }

        $(window).keydown(function (e){
            if ((e.keyCode === 70&&e.ctrlKey)||(e.keyCode === 70&&e.metaKey))
            {
                if(e.preventDefault) e.preventDefault();
            }
        });
    })

    //Modify the CSS of the Web page to fit the requirements of the experiment
    $("body").css({'min-width':'500px'});
    $("body" ).eq(0).css("width", ($(window).width()-240)+'px').css("overflow-x","hidden");
    $("body").css({'overflowX':'hidden'});
    $( window ).resize(function() {
        $( "body" ).eq(0).css("width", ($(window).width()-240)+'px').css("overflow-x","hidden");
    });

    if(location.hostname.indexOf("searchtechnologies") > -1){

        $("body #facets").css({"width":"30%"});
        $("body article").css({"width":"65%"});
        $("ol.result-list>li.result").css({"padding-left":"1em","padding-bottom": "0.3em", "padding-top": "0.3em", "padding-right": "1em"});
    }


    $('#logo').css({"z-index": 15});
    $("script[src='http://www.google-analytics.com/ga.js']").remove();


    if(location.host.indexOf("wikipedia.searchtechnologies.com")>-1&&location.href.indexOf("search?")==-1)
    {

    }
    else{
        $.noConflict();
    }
//    $('a').bind('click', false);
//    $('a').click(function(){
//        location.href=this.href;
//    });

    actionType = 'onLoad'
    verticalChange = 0;

    //Initiate the task info
    $.ajax({
        //Get current task info
        url: "/?proxyReq=getCurrentTask&milliseconds="+new Date().getTime(),
        async: false,
        dataType: 'json',
        success: function (data) {

            //Initiate the task info
            userId = data.userId;
            taskUIId = data.taskUIId;
            withCategories = data.withCategories;
            taskDescription = data.taskDescription;
            nthTask=data.nthTask;

            //if failed to get a user id, go to the first page of the task to select a user id
            if (userId == null || userId < 1) {
                window.location = databaseHostname + '/UserId.html';
            }

            //Update task status to the database
            $.ajax({
                url: "/?proxyReq=insertIdLog&userId="+userId+"&taskUIId="+taskUIId+"&status=inTask"+"&milliseconds="+new Date().getTime(),
                async: true,
                dataType: 'json',
                success: function (data) {
                    console.log(data);
                }
            });


            //Initiate the bookmark list on the sidebar
            $.ajax({
                url: "/?proxyReq=getBookMarkList&userId=" + userId + "&taskUIId=" + taskUIId + "&milliseconds=" + new Date().getTime(),
                async: false,
                dataType: 'json',
                contentType: "charset=utf-8",
                success: function (data) {
                    console.log(data);
                    bookmarkList = data;

                }
            });

        }
    });

                //Insert the "load" action in the database
                $.ajax({
                url: "/?proxyReq=addAction&userId=" + userId + "&taskUIId=" + taskUIId + "&actionType=" + "onload" + "&actionDescription=" + "&url=" + encodeURIComponent(location.href) + "&milliseconds=" + new Date().getTime(),
                async: false,
                dataType: 'json',
                contentType: "charset=utf-8",
                success: function (data) {
                    console.log("Action Id:"+data.actionId);
                    showParas(data.actionId);
                }
            });



    //Create the bookmark sidebar based on the information above
    createSidebar(bookmarkList);


//    $('body').disableFind();

    //Insert "close" action in the database before the Web page is closed
    window.onbeforeunload = function () {
        console.log(_getTime());
        $.ajax({
            url: "/?proxyReq=addAction&actionType=" + "close" +"&userId=" + userId + "&taskUIId=" + taskUIId+ "&actionDescription=" + "&time=" + encodeURIComponent(_getTime()) + "&url=" + encodeURIComponent(location.href) + "&milliseconds=" + new Date().getTime(),
            async: true,
            success: function (data) {
                console.log("Action Id:"+data.actionId);

            }
        });
    }


    //Monitor "scroll" actions

    $.fn.scrollStopped = function (callback) {
        $(this).scroll(function () {
            var self = this, t = $(self);
            if (t.data('scrollTimeout')) {
                clearTimeout(t.data('scrollTimeout'));
            }
            t.data('scrollTimeout', setTimeout(callback, 250, self));
        });
    };

    //Update the coordinate once scrolling stops

    $(window).scrollStopped(function () {
        var scrollTopTemp = (document.documentElement && document.documentElement.scrollTop) ||
            document.body.scrollTop;
        if (scrollTopTemp - scrollTop > 10 || scrollTopTemp - scrollTop < -10)//When scrolling, this function starts to work
        {
            //... put the function that you hope to load when the scroll bar stops
            verticalChange = scrollTopTemp - scrollTop;
            actionType = 'scroll';
            $.ajax({
                url: "/?proxyReq=addAction&userId=" + userId + "&taskUIId=" + taskUIId + "&actionType=" + "scroll" + "&actionDescription=" +verticalChange+ "&url=" + encodeURIComponent(location.href) + "&milliseconds=" + new Date().getTime(),
                async: true,
                dataType: 'json',
                contentType: "charset=utf-8",
                success: function (data) {
                    console.log("Action Id:"+data.actionId);
                    showParasScroll(data.actionId);
                }
            });

            //$(".title").fadeOut("fast").fadeIn("fast");

        }
        scrollTop = (document.documentElement && document.documentElement.scrollTop) ||
            document.body.scrollTop;
    });


    //Remove all external links on wikipedia.org pages
    var comp1 = new RegExp("//" + "wikipedia.searchtechnologies.com" + "($|/)");
    var comp2 = new RegExp("//" + "en.wikipedia.org" + "($|/)");

    $('a').each(function(){
        var url=$(this).attr('href');
        if(url!=undefined){
            if((url.substring(0,4) === "http") ? (comp1.test(url)?true:comp2.test(url)) : true){
                $(this).addClass('local');
            }
            else{
                $(this).addClass('external');
                $(this).contents().unwrap();
            }

        }
    });

});

//following codes are assigned to get the coordinates of the elements on the pages
function ajaxFunction(array, actionId) {
    // str1,str2,str3,str4, left,top,right,bottom


    var ajaxRequest;  // The variable that makes Ajax possible!
    var text = "";
    for (var i = 0; i < array.length; i++) {
        var navString = encodeURIComponent(_getTime())

        var title = array[i][0];
        var filename = array[i][1];
        var name = array[i][2];
        var id = array[i][3];
        var content = array[i][4];
        var left = array[i][5];
        var top = array[i][6];
        var right = array[i][7];
        var bottom = array[i][8];
        var actionType = array[i][9];
        var verticalChange = array[i][10];

        text += title + ", " + name + ", " + id + ", " + content + ", " + actionType + "," + verticalChange;
        text += ", coords: " + left + ", " + top + ", " + right + ", " + bottom + "<br />\n";


        var queryString = "?t=" + title + "&f=" + filename + "&n=" + name + "&i=" + id + "&c=" + content;
        queryString += "&time=" + navString + "&milliseconds=" + new Date().getTime() + "&url=" + encodeURIComponent(location.href);
        queryString += "&left=" + left + "&top=" + top + "&right=" + right + "&bottom=" + bottom + "&actionType=" + actionType + "&actionId=" + actionId + "&verticalChange=" + verticalChange;
        //alert(queryString);
        try {
            // Opera 8.0+, Firefox, Safari
            ajaxRequest = new XMLHttpRequest();
        } catch (e) {
            // Internet Explorer Browsers
            try {
                ajaxRequest = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                try {
                    ajaxRequest = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e) {
                    // Something went wrong
                    alert("Your browser is broken!");
                    return false;
                }
            }
        }
        ajaxRequest.open("GET", window.location.protocol == "https:" ? "https://" : "http://" + location.host + "/insertCoordsInDB.php" + queryString+"&proxyReq=addCoord&userId="+userId+"&taskUIId="+taskUIId+"&milliseconds="+new Date().getTime(), true);
        ajaxRequest.send(null);
    }

    return text;
}

function getBoundingClientRectInnerHTMLToStr(object) {
    var b = object.getBoundingClientRect();
    var filename = window.location.pathname.split("/");
    // filename = filename[filename.length-1].split(".")[0];
    filename = filename[filename.length - 1];
    var dataArr = new Array(12);
    dataArr[0] = document.title;
    dataArr[1] = filename;
    dataArr[2] = object.name;
    dataArr[3] = object.id;
    dataArr[4] = encodeURIComponent(object.innerText.substring(0, 20));
    dataArr[5] = Math.round(b.left);
    dataArr[6] = Math.round(b.top);
    dataArr[7] = Math.round(b.right);
    dataArr[8] = Math.round(b.bottom);
    dataArr[9] = actionType;
    dataArr[10] = verticalChange;
    return dataArr;
}

function storeParasScroll(actionId){
        var dataArr = new Array(10);
        mainArray.length = 0;// clear the data storing in the mainArray

        if (location.hostname.indexOf("searchtechnologies") > -1) {

            var sCount = document.getElementsByName('searchbox').length;
            for (i = 0; i < sCount; i++) {
                dataArr = getBoundingClientRectInnerHTMLToStr(document.getElementsByName('searchbox')[i]);
                dataArr[2] = 'searchbox';
                mainArray.push(dataArr);
            }

            ajaxFunction(mainArray, actionId);
        }

        else if (location.hostname.indexOf(".wikipedia.org") > -1) {

            var fhCount = document.getElementsByName('1st_level_heading').length;
            for (i = 0; i < fhCount; i++) {
                dataArr = getBoundingClientRectInnerHTMLToStr(document.getElementsByName('1st_level_heading')[i]);
                dataArr[2] = '1st_level_heading';
                mainArray.push(dataArr);
            }
            ajaxFunction(mainArray, actionId);
        }

}

function storeParas(actionId) {
    var dataArr = new Array(10);
    mainArray.length = 0;// clear the data storing in the mainArray

    if (location.hostname.indexOf("searchtechnologies") > -1) {

        var ccCount = document.getElementsByName('categorylist_category').length;
        for (i = 0; i < ccCount; i++) {
            dataArr = getBoundingClientRectInnerHTMLToStr(document.getElementsByName('categorylist_category')[i]);
            dataArr[2] = 'categorylist_category';
            mainArray.push(dataArr);
        }

        var rtCount = document.getElementsByName('result_title').length;
        for (i = 0; i < rtCount; i++) {
            dataArr = getBoundingClientRectInnerHTMLToStr(document.getElementsByName('result_title')[i]);
            dataArr[2] = 'result_title';
            mainArray.push(dataArr);
        }

        var rbCount = document.getElementsByName('result_body').length;
        for (i = 0; i < rbCount; i++) {
            dataArr = getBoundingClientRectInnerHTMLToStr(document.getElementsByName('result_body')[i]);
            dataArr[2] = 'result_body';
            mainArray.push(dataArr);
        }

        var rcCount = document.getElementsByName('result_categories').length;
        for (i = 0; i < rcCount; i++) {
            dataArr = getBoundingClientRectInnerHTMLToStr(document.getElementsByName('result_categories')[i]);
            dataArr[2] = 'result_categories';
            mainArray.push(dataArr);
        }

        var sCount = document.getElementsByName('searchbox').length;
        for (i = 0; i < sCount; i++) {
            dataArr = getBoundingClientRectInnerHTMLToStr(document.getElementsByName('searchbox')[i]);
            dataArr[2] = 'searchbox';
            mainArray.push(dataArr);
        }

        ajaxFunction(mainArray, actionId);
    }

    else if (location.hostname.indexOf(".wikipedia.org") > -1) {

        var fhCount = document.getElementsByName('1st_level_heading').length;
        for (i = 0; i < fhCount; i++) {
            dataArr = getBoundingClientRectInnerHTMLToStr(document.getElementsByName('1st_level_heading')[i]);
            dataArr[2] = '1st_level_heading';
            mainArray.push(dataArr);
        }

        var shCount = document.getElementsByName('2nd_level_heading').length;
        for (i = 0; i < shCount; i++) {
            dataArr = getBoundingClientRectInnerHTMLToStr(document.getElementsByName('2nd_level_heading')[i]);
            dataArr[2] = '2nd_level_heading';
            mainArray.push(dataArr);
        }

        var shcCount = document.getElementsByName('2nd_level_heading_content').length;
        for (i = 0; i < shcCount; i++) {
            dataArr = getBoundingClientRectInnerHTMLToStr(document.getElementsByName('2nd_level_heading_content')[i]);
            dataArr[2] = '2nd_level_heading_content';
            mainArray.push(dataArr);
        }

        var lsCount = document.getElementsByName('left_sidebar').length;
        for (i = 0; i < lsCount; i++) {
            dataArr = getBoundingClientRectInnerHTMLToStr(document.getElementsByName('left_sidebar')[i]);
            dataArr[2] = 'left_sidebar';
            mainArray.push(dataArr);
        }

        var riCount = document.getElementsByName('right_infobox').length;
        for (i = 0; i < riCount; i++) {
            dataArr = getBoundingClientRectInnerHTMLToStr(document.getElementsByName('right_infobox')[i]);
            dataArr[2] = 'right_infobox';
            mainArray.push(dataArr);
        }

        var cpCount = document.getElementsByName('contents_panel').length;
        for (i = 0; i < cpCount; i++) {
            dataArr = getBoundingClientRectInnerHTMLToStr(document.getElementsByName('contents_panel')[i]);
            dataArr[2] = 'contents_panel';
            mainArray.push(dataArr);
        }

        var shcpCount = document.getElementsByName('2nd_level_heading_content_p').length;
        for (i = 0; i < shcpCount; i++) {
            dataArr = getBoundingClientRectInnerHTMLToStr(document.getElementsByName('2nd_level_heading_content_p')[i]);
            dataArr[2] = '2nd_level_heading_content_p';
            mainArray.push(dataArr);
        }

        var shctCount = document.getElementsByName('2nd_level_heading_content_thumb').length;
        for (i = 0; i < shctCount; i++) {
            dataArr = getBoundingClientRectInnerHTMLToStr(document.getElementsByName('2nd_level_heading_content_thumb')[i]);
            dataArr[2] = '2nd_level_heading_content_thumb';
            mainArray.push(dataArr);
        }


        ajaxFunction(mainArray, actionId);
    }

}
function showParas(actionId) {
    storeParas(actionId);
}

function showParasScroll(actionId){
    storeParasScroll(actionId);
}

//Get local time
function _getTime() {
    var d = new Date();
    var currentTime = new Date().toLocaleString();
    currentTime = currentTime.substring(0, currentTime.length - 3).concat("." + d.getMilliseconds()).concat(currentTime.substring(currentTime.length - 3, currentTime.length));
    return currentTime;
}

function goSearch(){
    location.href="wikipedia.searchtechnologies.com";
}

//Create bookmark sidebar
function createSidebar(bookmarkList) {
    var sidebar, bookmark;

    $("#theSidebar").contents().find("head").append("<link rel='stylesheet' href='http://localhost:9000/common.css' type='text/css'>");

    sidebar = $("<div id='wikisidebar'></div>").attr({}).prepend($("<div id='taskDescription' class='masterTooltip'></div>").attr({"title": "Task Description: ".concat(taskDescription)}).html("Task Description:<br>".concat(taskDescription))).append("<div id='bookmarks'></div>");
    sidebar.prepend($("<div style='margin-top: 10px ; border-bottom: 1px dotted #808080;'></div>"));
    sidebar.prepend($("<button onclick=parent.location.reload() style='margin-top: 5px'> &nbsp;Reload&nbsp; </button>"));
    sidebar.prepend("<br>");
    sidebar.prepend($("<button onclick=window.history.forward()>Go Forward</button>"));
    sidebar.prepend($("<span style='padding-left: 20px'></span>"));
    sidebar.prepend($("<button onclick=window.history.back()>Go Back</button>"));




    $("#theSidebar").contents().find("body").append(sidebar);


    $("#theSidebar").contents().find("#bookmarks").append($("<input type='button' id='add' value='Add Page'/>"));
    $("#theSidebar").contents().find("#bookmarks").append($("<span style='padding-left: 20px'></span>"));
    $("#theSidebar").contents().find("#bookmarks").append($("<input type='button' id='finish' value='Finish'/>"));
    for (var i = 0; i < bookmarkList.length; i++) {
        bookmark = $("<div  class='bookmark'></div>").append($("<div class='title'></div>").append($("<a target='_parent'></a>").html(bookmarkList[i]['title']).attr({"href": bookmarkList[i]['url']}))).append(" ").append("<div style='float: right; padding-top: 4px; '><a class='edit'><img style='padding-right:5px;opacity: 0.5;' src='http://localhost:9000/pencil.png' width='10' height='10'></a><a class='remove'><img style='opacity: 0.5;' src='http://localhost:9000/cancel.png' width='10' height='10'></a></div>").append("<br>").append($("<a class='bookmarkNote'></a>").attr("title",bookmarkList[i]['description']).html(bookmarkList[i]['description'].substring(0,80)));//   <a href=" + bookmarkList[i]['url'] + ">" + bookmarkList[i]['title'] + "</a><a href=" + bookmarkList[i]['url'] + "><a>remove</a><br><a>" + bookmarkList[i]['description'] + "</a></div>");
        $("#theSidebar").contents().find("#bookmarks").append(bookmark);
    }
    $("#theSidebar").contents().find(".bookmarkNote");
    $("#theSidebar ").contents().find("#taskDescription");


    $("#theSidebar").contents().find("#bookmarks").delegate('.edit', 'click', function () {

        var editNum = $("#theSidebar").contents().find(".edit").index(this);
        console.log(editNum);
        var item=$(this).parent().parent();

        $.prompt(bookmarkList[editNum].title+"<textarea id='bmNoteEdit' style='width: 380px' rows='4'>"+bookmarkList[editNum].description+"</textarea>", {
            title: "Edit Notes",
            buttons: { "OK": true, "Cancel": false },
            submit: function (e, v, m, f) {
                // use e.preventDefault() to prevent closing when needed or return false.
                // e.preventDefault();
                // use e.preventDefault() to prevent closing when needed or return false.
                // e.preventDefault();
                if (v) {

                    bookmarkList[editNum].description=$("#bmNoteEdit").val();

                    $.ajax({
                        type: 'POST',
                        async: true,
                        url:  "/updateBookmarks.php?proxyReq=updateBookmarks&userId="+userId+"&taskUIId="+taskUIId+"&milliseconds="+new Date().getTime(),
                        data: JSON.stringify({"bookmarks": bookmarkList}),
                        success: function (data) {
                            console.log(data)
                        },
                        contentType: "application/json",
                        dataType: 'json'
                    });
                    $('#bmNote').val("");

                    bookmark = $("<div  class='bookmark' ></div>").append($("<div class='title'></div>").append($("<a target='_parent'></a>").html(bookmarkList[editNum].title).attr({"href": bookmarkList[editNum].url}))).append(" ").append("<div style='float: right; padding-top: 4px; '><a class='edit'><img style='padding-right:5px;opacity: 0.5;' src='http://localhost:9000/pencil.png' width='10' height='10'></a><a class='remove'><img style='opacity: 0.5;' src='http://localhost:9000/cancel.png' width='10' height='10'></a></div>").append("<br>").append($("<a class='bookmarkNote'></a>").attr("title",bookmarkList[editNum].description).html(bookmarkList[editNum].description.substring(0,80)));//   <a href=" + bookmarkList[i]['url'] + ">" + bookmarkList[i]['title'] + "</a><a href=" + bookmarkList[i]['url'] + "><a>remove</a><br><a>" + bookmarkList[i]['description'] + "</a></div>");


                    $("#theSidebar").contents().find("#bookmarks").find(".bookmark").eq(editNum).replaceWith(bookmark);
//                    $("#theSidebar").contents().find("#bookmarks").append(bookmark);
//
//                    item.find(".bookmarkNote").eq(0).attr("title", bookmarkList[editNum].description);
//                    item.find(".bookmarkNote").eq(0).html(bookmarkList[editNum].description);
                }
            }
        });




    });


    $("#theSidebar").contents().find("#bookmarks").delegate('.remove', 'click', function () {

        var removeNum = $("#theSidebar").contents().find(".remove").index(this);
        console.log(removeNum);
        var item=$(this).parent().parent();

        $.prompt("", {

            title: "Delete This Note?",
            buttons: { "Yes": true, "No": false },
            submit: function (e, v, m, f) {
                // use e.preventDefault() to prevent closing when needed or return false.
                // e.preventDefault();
                if (v) {

                    bookmarkList.splice(removeNum, 1);
                    console.log(bookmarkList.length);
                    for (var i = removeNum; i < bookmarkList.length; i++) {
                        console.log("bookmark#"+i);
                        console.log(bookmarkList[i]);
                        bookmarkList[i]['pos'] = bookmarkList[i]['pos'] - 1;
                    }
                    console.log("bookmarkList:");
                    console.log(bookmarkList);

                    $.ajax({
                        type: 'POST',
                        async: true,
                        url:  "/updateBookmarks.php?proxyReq=updateBookmarks&userId="+userId+"&taskUIId="+taskUIId+"&milliseconds="+new Date().getTime(),
                        data: JSON.stringify({"bookmarks": bookmarkList}),
                        success: function (data) {
                            console.log(data)
                        },
                        contentType: "application/json",
                        dataType: 'json'
                    });
                    item.remove();
                }
            }
        });




    });


    $("#theSidebar").contents().find("#finish")
        .click(function () {
            var finalNote="";
            console.log(bookmarkList);
            for(var i=0; i<bookmarkList.length;i++){
                finalNote+= bookmarkList[i].title+"\n";
                finalNote+= bookmarkList[i].description+"\n";
                finalNote+= "\n";

            }


            $.prompt("<textarea id='finalNote' style='width:380px' rows='20'>"+finalNote+"</textarea>", {
                title: "Check and Edit Notes",
                buttons: { "OK": true, "Cancel": false },
                submit: function (e, v, m, f) {

                    if (v) {

                    var note = $("#finalNote").val();
                    console.log(note);
//                    $.ajax({
//                    url: "/?proxyReq=addFinalNote&userId=" + userId + "&taskUIId=" + taskUIId + "&url=" + encodeURIComponent(location.href) + "&note=" + encodeURIComponent(note) + "&milliseconds=" + new Date().getTime(),
//                    async: false,
//                    dataType: 'json',
//                    success: function (data) {
//                        console.log(data);
//                        $("finalNote").val("");
//                    }
//                });

                        $.ajax({
                            type: 'POST',
                            async: false,
                            url: "/?proxyReq=addFinalNote&userId=" + userId + "&taskUIId=" + taskUIId +"&milliseconds=" + new Date().getTime(),
                            data: JSON.stringify({"finalNote":{ "url":location.href , "title":"End_Of_A_Task", "description":note,"pos":-1, "userId":userId, "taskUIId":taskUIId}}),
                            success: function (data) {
                                console.log("success");
                                console.log(data)
                            },
                            contentType: "application/json",
                            dataType: 'json'
                        });



                        if(closeAfterDone==true&&taskUIId!=0){
                            var win=window.open("","_top","","true");
                            win.opener=true;
                            win.close();
                        }
                        else

                        location.href="http://calais.ischool.utexas.edu/Post_task_qs.html";
                    }
                }
            });

        })



    $("#theSidebar").contents().find("#add").click(function () {
        $.prompt(document.title+"<textarea id='bmNote' style='width: 380px' rows='4'></textarea>", {
            title: "Add Notes To This Page",
            buttons: { "OK": true, "Cancel": false },
            submit: function (e, v, m, f) {
                // use e.preventDefault() to prevent closing when needed or return false.
                // e.preventDefault();

                if (v) {
                    var note = $("#bmNote").val();
                    bookmark = $("<div  class='bookmark' ></div>").append($("<div class='title'></div>").append($("<a target='_parent'></a>").html(document.title).attr({"href": location.href}))).append(" ").append("<div style='float: right; padding-top: 4px; '><a class='edit'><img style='padding-right:5px;opacity: 0.5;' src='http://localhost:9000/pencil.png' width='10' height='10'></a><a class='remove'><img style='opacity: 0.5;' src='http://localhost:9000/cancel.png' width='10' height='10'></a></div>").append("<br>").append($("<a class='bookmarkNote'></a>").attr("title",note).html(note.substring(0,80)));//   <a href=" + bookmarkList[i]['url'] + ">" + bookmarkList[i]['title'] + "</a><a href=" + bookmarkList[i]['url'] + "><a>remove</a><br><a>" + bookmarkList[i]['description'] + "</a></div>");
                    $("#theSidebar").contents().find("#bookmarks").append(bookmark);
                    bookmarkList.push({"url": location.href, "userId": userId, "taskUIId": taskUIId, "description": note, "title": document.title, "pos": bookmarkList.length + 1});
                    $.ajax({
                        type: 'POST',
                        async: true,
                        url:  "/updateBookmarks.php?proxyReq=updateBookmarks&userId="+userId+"&taskUIId="+taskUIId+"&milliseconds="+new Date().getTime(),
                        data: JSON.stringify({"bookmarks": bookmarkList}),
                        success: function (data) {
                        },
                        contentType: "application/json",
                        dataType: 'json'
                    });
                    $('#bmNote').val("");
                    $(".bookmarkNote").last();


                }
            }
        });
    });

    $("#theSidebar").contents().find(".masterTooltip").html();
    $("#theSidebar").contents().find(".masterTooltip").hover(function(){
        // Hover over code
        var title = $(this).attr('title');
        console.log("aa"+title);
        $(this).data('tipText', title).removeAttr('title');
        $('<p class="tooltip"></p>')
            .text(title)
            .appendTo('body')
            .fadeIn('slow');
    }, function() {
        // Hover out code
        $(this).attr('title', $(this).data('tipText'));
        $('.tooltip').remove();
    }).mousemove(function(e) {
            var mousex = e.pageX + 20; //Get X coordinates
            var mousey = e.pageY + 10; //Get Y coordinates
            $('.tooltip')
                .css({ top: mousey, left: mousex })
        });

}

//Parse parameter value of a url
function getParameterByName(name, url) {  //Parse the parameters in a URL
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(url);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}


//Remove a number of categories under each result if the number of the categories is more than the we expect
function categorySelector(result, remain) {
    var categorylistOfTheResult = result.find(".search-field, .capsule, .f_categories");
    var lengthOfTheCategoryList = categorylistOfTheResult.length;
    var removeNum = lengthOfTheCategoryList - remain;
    var min = 65535;
    for (var j = 0; j < removeNum; j++) {

        for (var i = 1; i < lengthOfTheCategoryList; i++) {
            if (categorylistOfTheResult.eq(i).find("a").attr('weight') < min) {
                min = i;
            }
        }
        result.find(".search-field, .capsule, .f_categories").eq(i).remove();
        lengthOfTheCategoryList--;
    }


}

