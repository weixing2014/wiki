if (location.hostname.indexOf("searchtechnologies") > -1) {


    //insert some css to the head of the page, in order to hide the elements we don't want to show before the page is not fully loaded
    document.write("<style type='text/css'>  ul { display:none;} .smallField { display:none ;} .result-list{display:none;} .smallField>span {display:none;} .smallField>br{display:none;}  #f_categories>dl>dd {display:none; } #f_categories>div>a{display:none;} #f_year { display:none ;} #f_type {display:none;} #f_author {display:none} </style>");


    $(document).ready(function () {
        console.log("cat"+withCategories);
        if(withCategories>0){
            //Remove unused javascript
            $("ul").show();
            $("script:last-child").remove();

            scrollTop = (document.documentElement && document.documentElement.scrollTop) ||
                document.body.scrollTop;   //Get the Y axis

            $('#f_categories div').attr('id', 'd_categories');
            $('.smallField br').remove();
            $('ol>li>div>div').css({"margin-left": "0"});
            $('.primary').prepend($("<div class='search-field capsule f_categories'><p>Categories:</p></div>"));

            $("#f_type").parent().remove();
            $("#f_author").parent().remove();
            $("#f_year").parent().remove();
            $('#f_categories div').remove();
            $('#f_categories>.primary-filters>dd').remove();
            $('#f_categories>.secondary-filters').remove();
            $('#f_categories').append($('<div></div>'));
            $('#f_categories div').prepend("<div ><img  id='loader' src='http://localhost:9000/6-1.gif' height='12' width='12'><font color='#808080'> Loading...</font></div>"); //Show loading till get the category list from the proxy

            $('.more-or-less').removeClass();
            $('.secondary').removeClass().addClass('primary'); //".secondary" hides categories within the label "more...", change it to ".primary" to show them
            $('.more').empty(); // Remove the label "more..."


            $('#f_categories div').load(location.host + '/?proxyReq=newCategories&timeStamp=' + new Date().getTime()+"&url="+encodeURIComponent(location.href));
            var categoryChecker = setInterval(function () {  //Hide the results till the category list shows

                console.log("onload...");
                if ($('#f_categories>div>dl>dd').eq(0).html()) {

                    clearInterval(categoryChecker);
                   console.log("hreher");
                    $(".primary").hide();
                    $(".result-list").show();
                    $(".capsule > .value").each(function (index) {
                        var categoryValue = $(this).find("a").text();
                        var categoryWeight = $("#f_categories .filter").filter(function (index) {
                            return $(this).find('a').eq(0).text() === categoryValue;
                        }).eq(0).find('.count').text();
                        categoryWeight = !categoryWeight ? categoryWeight : 0;

                        $(this).find("a").attr("weight", categoryWeight);
                    });

                    $(".primary").show();

                    $(".filter-list>.filter").each(function (index) {
                        $(this).attr({name: "categorylist_category", id: "categorylist_category_" + (index + 1)});
                    });

                    $(".result-list>li>.title>.value").each(function (index) {
                        $(this).attr({name: "result_title", id: "result_title_" + $(this).text().split(" ").join("_")});
                    });

                    $(".result-list>li>.teaser").each(function (index) {
                        $(this).attr({name: "result_body", id: "result_body_" + $(this).parent().children().eq(0).text().split(" ").join("_")});
                    });

                    $(".result-list>li>.smallField").each(function (index) {
                        $(this).attr({name: "result_categories", id: "result_categories_" + $(this).parent().children().eq(0).text().split(" ").join("_")});
                    });

//              $("#facets").attr("name","category_list");

                    /*Remove the categories in the blacklist from the category list on the left*/
                    for (var i = 0; i < blacklist.length; i++) {
                        $("#f_categories .filter").filter(function (index) {
                            return $(this).find('a').text().toLowerCase().indexOf(blacklist[i].toLowerCase()) == 0;
                        }).remove();
                        $(".keywords > .search-field, .capsule, .f_categories").filter(function (index) {
                            return $(this).find('.value > a').text().toLowerCase().indexOf(blacklist[i].toLowerCase()) == 0;
                        }).remove();
                    }

                    for (var i = 0; i < $(".keywords").length; i++)////Remove the extra categories under each result
                    {
                        categorySelector($(".keywords").eq(i), maxCategoryNumOfEachResult);
                    }

                    $(".result-list>li").each(function (index) {
                        $(this).attr({name: "result", id: "result_" + (index + 1)});
                    });
                    $(".searchform").eq(0).attr("name", "searchbox");


                    $.ajax({
                        url: "/?proxyReq=addAction&userId=" + userId + "&taskUIId=" + taskUIId + "&actionType=" + "load_completed" + "&actionDescription=" + "&url=" + encodeURI(location.href) + "&milliseconds=" + new Date().getTime(),
                        async: false,
                        dataType: 'json',
                        contentType: "charset=utf-8",
                        success: function (data) {
                            console.log("Action Id:"+data.actionId);
                            showParas(data.actionId);
                        }
                    });

                }
            }, 200);
        }
        else{
            $(".primary").hide();
            $(".result-list").show();
            $(".result-list>li").each(function (index) {
                $(this).attr({name: "result", id: "result_" + (index + 1)});
            });

            $(".result-list>li>.title>.value").each(function (index) {
                $(this).attr({name: "result_title", id: "result_title_" + (index + 1)});
            });

            $(".result-list>li>.teaser").each(function (index) {
                $(this).attr({name: "result_body", id: "result_body_" + (index + 1)});
            });
            $(".searchform").eq(0).attr("name", "searchbox");
            $(".results").attr("name", "results");
            showParas();
        }
    });
}