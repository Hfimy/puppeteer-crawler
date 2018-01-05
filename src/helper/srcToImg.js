const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);

module.exports = async (src, dir) => {
    if (/\.(jpg|jpeg|png|gif)$/.test(src)) {
        await urlToImg(src, dir);
    } else {
        await base64ToImg(src, dir);
    }
};

//url=>image
const urlToImg = promisify((url, dir, cb) => {
    console.log(url);//eslint-disable-line
    const mode = /^https:/.test(url) ? https : http;
    const ext = path.extname(url);
    const file = path.join(dir, `${Date.now()}${ext}`);

    mode.get(url, res => {
        res.pipe(fs.createWriteStream(file))
            .on('finish', () => {
                cb();
            });
    });

    // 自己采用promise实现
    // const getImage = (url, file) => {
    //     return new Promise((resolve, reject) => {
    //         mode.get(url, res => {
    //             res.pipe(fs.createWriteStream(file)).on('finish', () => {
    //                 console.log('here1')
    //                 resolve()
    //             })
    //         })
    //     })
    // }

    // 使用promisify包装
    // const getImage = promisify((url, file, cb) => {
    //     mode.get(url, res => {
    //         res.pipe(fs.createWriteStream(file)).on('finish', () => {
    //             cb()
    //         })
    //     })
    // })

});

//base64=>image
const base64ToImg = async (url, dir) => {
    console.log('base64图片编码');  //eslint-disable-line
    //date:image/png;base64,....
    const matches = url.match(/^data:(.+?);base64,(.+)$/); //. 除换行符外的任意一个单字符  + 匹配一个或多个  ? 匹配零个或一个,非贪婪匹配

    const content = matches[2];
    const ext = matches[1].split('/')[1].replace('jpeg', 'jpg');   //如果是jpeg格式则转为jpg
    const file = path.join(dir, `${Date.now()}.${ext}`);
    await writeFile(file, content, 'base64');
};
