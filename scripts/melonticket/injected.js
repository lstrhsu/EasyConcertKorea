(function () {
    console.log("Interceptor 已注入到页面环境");

    const originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (data) {
        // console.log("检测到 XHR 请求:", this._url);
        
        this.addEventListener('load', function () {
            // console.log("XHR 响应接收:", this.responseURL);
            
            if (this.responseText.includes('getBlockSummaryCallBack')) {
                // console.log("捕获到座位数据响应");
                try {
                    const jsonText = this.responseText
                        .replace(/^\/\*\*\/getBlockSummaryCallBack\(/, '')
                        .replace(/\);?$/, '');
                    const jsonData = JSON.parse(jsonText);
                    
                    // console.log("座位数据解析成功:", JSON.stringify(jsonData, null, 2));
                    
                    // 使用 localStorage 存储数据
                    localStorage.setItem('seatSummaryData', JSON.stringify(jsonData));
                    // console.log("座位数据已存储到 localStorage");
                    
                    // 发送消息到 content script
                    window.dispatchEvent(new CustomEvent('seatDataUpdate', {
                        detail: jsonData
                    }));
                } catch (error) {
                    console.error("解析JSON出错:", error);
                    console.error("原始响应文本:", this.responseText);
                }
            }
        });

        return originalXHRSend.apply(this, arguments);
    };
})(); 