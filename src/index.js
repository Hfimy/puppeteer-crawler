/*eslint-disable*/
const puppeteer = require('puppeteer');
//eslint-disable-next-line
const { screenshot, image } = require('./config/default');
const srcToImg = require('./helper/srcToImg');

(async () => {
    try {
        // const browser = await puppeteer.launch(); //默认是无界面
        const browser = await puppeteer.launch({
            headless: false,
            // executablePath: path.resolve()
        });
        console.log('open browser, waiting...');//eslint-disable-line
        const page = await browser.newPage();
        await page.goto('https://image.baidu.com/');

        // 截图
        await page.screenshot({
            path: `${screenshot}/${Date.now()}.png`
        });
        // 导出pdf仅在无界面模式下可以实现
        // await page.pdf({
        //     path: `${screenshot}/${Date.now()}.pdf`,
        //     format: 'A4'
        // });
        // await page.setViewport({
        //     width: 1920,
        //     height: 1080
        // });

        await page.focus('#kw');

        await page.keyboard.sendCharacter('青春');

        // await page.click('.s_btn') // 假设它或它的父级被设置为display:none导致
        await page.evaluate(() => {
            //eslint-disable-next-line
            document.querySelector('.s_btn').click();
        });

        page.on('load', async () => {
            //eslint-disable-next-line no-console
            console.log('page is loaded, start fetch ...');
            let isLoaded = false
            // const srcs = await page.evaluate(() => {
            //     const images = document.querySelectorAll('img.main_img');
            //     return Array.prototype.map.call(images, image => image.src)
            //     // return Array.from(images).map(image=>image.src)
            // })
            let srcs, total = 0, index = 0;//资源列表，总数，已抓取数量

            //此处注意，await只能用在使用async声明的函数，而下面的写法无法生效，可能因为map只能接受同步函数参数
            // srcs.map(async (src) => {
            //     await srcToImg(src, image, page);
            //     await page.waitFor(200);
            //     console.log('fetch end,start next')
            // })

            //抓取当前资源列表
            const fetchImg = async () => {
                srcs = await page.$$eval('img.main_img', images => Array.from(images).map(image => image.src));
                total = srcs.length;
                console.log('页面可抓取数量', total)
                for (let concurrent = 0; index < total;) {
                    srcToImg(srcs[index], image, index + 1);
                    concurrent++;
                    index++;
                    //控制并发数
                    if (concurrent === 10) {
                        console.log('waiting 200ms');
                        await page.waitFor(200);
                        concurrent = 0;
                    }
                }
            }
            //下拉页面加载
            const scroll = async () => {
                //注意，这里面不能操作外面的变量
                isLoaded = await page.evaluate(() => {
                    if (Math.ceil(document.documentElement.clientHeight + document.documentElement.scrollTop) < document.documentElement.scrollHeight) {
                        window.scrollBy(0, document.documentElement.clientHeight);
                        return false;
                    } else {
                        return true;
                    }
                });
                await page.waitFor(1000);
            }

            const fetchOnce = async () => {
                //一轮抓取
                await fetchImg()
                //一轮滚动条下拉
                await scroll()
                console.log('下拉加载');
            }

            const fetchAll = async (n) => {
                console.log(`目标值 >${n}`)

                while (total < n) {
                    await fetchOnce()
                    console.log('已抓取数量', total);

                    if (isLoaded) {
                        console.log('重复下拉')
                        await page.waitFor(1000);
                        await scroll();
                        if (isLoaded) {
                            console.log('页面已经到底了~')
                            break;
                        }
                    }

                }

                console.log(`抓取结束，共抓取${total}条`)
                await browser.close();

            }

            await fetchAll(200);//抓取100条数据

            // for (let i = 0; i < srcs.length; i++) {
            //     await srcToImg(srcs[i], image);
            //     await page.waitFor(200);
            // }

            //并发控制，事实证明这种写法无效，一旦resolve则下面的请求也会被rejected
            // let count = 0;
            // const concurrent = (srcs, image) => {
            //     return new Promise((resolve, reject) => {
            //         for (let j = 0; ; count++ , j++) {
            //             if (j === 5 || count === srcs.length) {
            //                 resolve(); //并发数设为5
            //                 return;
            //             }
            //             srcToImg(srcs[count], image)
            //         }
            //     })
            // }

            // while (count < srcs.length) {
            //     console.log('start')
            //     await concurrent(srcs, image);
            //     await page.waitFor(4000);
            //     console.log('next 5')
            // }
            //关闭浏览器
            // await browser.close();
        });
    } catch (e) {
        //eslint-disable-next-line no-console
        console.log(e);
    }

})();
/*eslint-enable*/
