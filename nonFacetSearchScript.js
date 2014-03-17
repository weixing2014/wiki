if (location.hostname.indexOf("searchtechnologies") > -1) {
    document.write("<style type='text/css'> ul { display:none;} .smallField { display:none ;}</style>"); //hide the category list on the left
//
//    for(var i=0;i<$(".keywords").length;i++)//Remove the extra categories under each result
//    {
//        categorySelector($(".keywords").eq(i),maxCategoryNumOfEachResult);
//    }

    $(document).ready(function () {
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

    });

}
