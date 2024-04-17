const http = require('http');
const mongoose = require('mongoose');
const headers = require('./headers');
const handleError = require('./handleError');
const handleSuccess = require('./handleSuccess');

const dotenv = require("dotenv");
// 導入上面的 .env 檔
dotenv.config({ path: "./config.env" });

// 將 <password> 替換成環境變數內的 DATABASE_PASSWORD
const DB = process.env.DATABASE.replace(
    "<password>",
    process.env.DATABASE_PASSWORD
  );

mongoose
.connect(
    // "mongodb://localhost:27017/forum"
    DB
)
.then(() => console.log('資料庫連接成功'))
.catch((err) => {
    console.log(err);
  });
const Post = require('./models/post')

// schema 結束
const requestListener = async(req, res)=>{
    let body = "";
    req.on('data', chunk=>{
        body+=chunk;
    })

    if(req.url=="/posts" && req.method == "GET"){
        const post = await Post.find();
        handleSuccess(res, post, '取得所有資料成功');
    }else if(req.url=="/posts" && req.method == "POST"){
        req.on('end',async()=>{
            try{
                const data = JSON.parse(body);
                if(data.content){
                    const newPost = await Post.create(
                        {
                            name: data.name,
                            content: data.content,
                        }
                    );
                    handleSuccess(res, newPost, '新增單筆資料成功');
                }else{
                  handleError(res);
                }
            }catch(err){
              handleError(res, err);
            }
        })
    }else if (req.url == "/posts" && req.method == "DELETE") {
        const data = await Post.deleteMany({}); // {} 刪除全部
        handleSuccess(res, [], '刪除全部資料成功');
    }else if(req.url.startsWith("/posts/") && req.method=="DELETE"){
        const id = req.url.split('/').pop();
        await Post.findByIdAndDelete(id);
        handleSuccess(res, null, '刪除單筆資料成功');
    }else if (req.url.startsWith("/posts/") && req.method == "PATCH") {
        req.on("end", async () => {
          try {
            const id = req.url.split("/")[2];
            const data = JSON.parse(body);
    
            const updatedPost = await Post.findByIdAndUpdate(
              id,
              {
                name: data.name,
                content: data.content
              },
              { new: true }
            ); // 返回更新後的文檔
    
            if (updatedPost) {
              handleSuccess(res, updatedPost, '更新單筆資料成功');
            } else {
              handleError(res, err);
            }
          } catch(err) {
            handleError(res, err);
          }
        });
    }else if(req.method == "OPTIONS"){
        res.writeHead(200,headers);
        res.end();
    }else{
        res.writeHead(404,headers);
        res.write(JSON.stringify({
            "status": "false",
            "message": "無此網站路由"
        }));
        res.end();
    }
}
const server = http.createServer(requestListener);
server.listen(process.env.PORT || 3000);