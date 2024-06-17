/**************************
彩云天气Pro SVIP 优化
***************************/


let body = $response.body;
if (body) {
  switch (!0) {
    case /v2\/user\?(.*&)?app_name=weather(&.*)?$/.test($request.url):
      try {
        let m = JSON.parse(body);
        // 将 SVIP 结束时间设置为半年后
        const now = new Date();
        now.setMonth(now.getMonth() + 6);
        now.setHours(8, 30, 0, 0);
        const timestamp = parseFloat((now.getTime() / 1000).toFixed(1));
        // 修改返回数据
        m.result?.svip_expired_at = timestamp;
        m.result?.wt?.vip?.svip_expired_at = timestamp;
        m.result?.vip_type = 's';
        m.result?.is_vip = true;
        body = JSON.stringify(m);
      } catch (u) {
        console.log("彩云天气Pro SVIP 优化出错：" + u);
      }
      break;
    default:
        $done({})
  }
  $done({
      body
  })
} else $done({});
