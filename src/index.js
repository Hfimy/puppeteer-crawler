const puppeteer = require('puppeteer')
const { screenshot, image } = require('./config/default');
const srcToImg = require('./helper/srcToImg');

(async () => {
    try {
        // const browser = await puppeteer.launch(); //默认是无界面
        const browser = await puppeteer.launch({headless:false});
        const page = await browser.newPage();
        await page.goto('https://image.baidu.com/');
        // await page.screenshot({
        //     path: `${screenshot}/${Date.now()}.png`
        // })
        // await page.pdf({
        //     path: `${screenshot}/${Date.now()}.pdf`,
        //     format:'A4'
        // })
        await page.setViewport({
            width: 1920,
            height: 1080
        })

        await page.focus('#kw')

        await page.keyboard.sendCharacter('青春');

        // await page.click('.s_btn') // 假设它或它的父级被设置为display:none导致
        await page.evaluate(()=>{
            document.querySelector('.s_btn').click()
        })

        page.on('load', async () => {
            console.log('The page is loaded, start fetch ...');

            // const srcs = await page.evaluate(() => {
            //     const images = document.querySelectorAll('img.main_img');
            //     return Array.prototype.map.call(images, image => image.src)
            //     // return Array.from(images).map(image=>image.src)
            // })
            const srcs=await page.$$eval('img.main_img',images=>Array.from(images).map(image=>image.src));

            srcs.map(src=>srcToImg(src,image));

            await browser.close()
        })
    } catch (e) {
        console.log(e)
    }
})()
