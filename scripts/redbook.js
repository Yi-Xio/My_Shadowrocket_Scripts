/**************************************************************************************
本文件参考自墨鱼项目编写
墨鱼项目地址：https://github.com/ddgksf2013/ddgksf2013
原文件名称：redbook_json.js
原文件版本：V1.0.13
原文件地址：https://raw.githubusercontent.com/ddgksf2013/Scripts/master/redbook_json.js
***************************************************************************************/


let body = $response.body;
if (body) {
  switch (!0) {
    case /api\/sns\/v\d\/homefeed\/categories\?/.test($request.url):
      try {
        let m = JSON.parse(body);
        m.data.categories = m.data.categories.filter(e => !("homefeed.shop" == e.oid || "homefeed.live" == e.oid));
        // 增加 剔除首页上类型栏中的‘视频’与‘直播’
        let n = ['视频', '直播', ];
        m.data.categories = m.data.categories.filter(e => !n.includes(e.name));
        body = JSON.stringify(m);
      } catch (u) {
        console.log("categories: " + u);
      }
      break;
    case /api\/sns\/v\d\/homefeed\?/.test($request.url):
      try {
        let O = JSON.parse(body);
        // 增加 剔除首页信息流中的视频推荐
        O.data = O.data.filter(e => !e.is_ads && e.type !== "video");
        body = JSON.stringify(O);
      } catch (R) {
        console.log("homefeed: " + R);
      }
      break;
    default:
        $done({})
  }
  $done({
      body
  })
} else $done({});
