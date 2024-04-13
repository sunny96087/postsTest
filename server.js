const http = require('http');
const mongoose = require('mongoose');

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
    const headers = {
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PATCH, POST, GET,OPTIONS,DELETE',
        'Content-Type': 'application/json'
    }
    let body = "";
    req.on('data', chunk=>{
        body+=chunk;
    })

    if(req.url=="/posts" && req.method == "GET"){
        const post = await Post.find();
        res.writeHead(200,headers);
        res.write(JSON.stringify({
            "status": "success",
            post
        }));
        res.end();
    }else if(req.url=="/posts" && req.method == "POST"){
        req.on('end',async()=>{
            try{
                const data = JSON.parse(body);
                if(data.content !== undefined){
                    const newPost = await Post.create(
                        {
                            name: data.name,
                            content: data.content,
                        }
                    );
                    res.writeHead(200,headers);
                    res.write(JSON.stringify({
                        "status": "success",
                        "data": newPost,
                    }));
                    res.end();

                }else{
                    res.writeHead(400,headers);
                    res.write(JSON.stringify({
                        "status": "false",
                        "message": "欄位未填寫正確，或無此 todo ID",
                    }));
                    res.end();
                }
            }catch(error){
                res.writeHead(400,headers);
                res.write(JSON.stringify({
                    "status": "false",
                    "message": error,
                }));
                res.end();
            }
        })
    }else if (req.url == "/posts" && req.method == "DELETE") {
        const data = await Post.deleteMany({}); // {} 刪除全部
        res.writeHead(200, headers);
        res.write(
          JSON.stringify({
            "status": "success",
            "data": [],
            "message": "刪除全部資料成功"
          })
        );
        res.end();
    }else if(req.url.startsWith("/posts/") && req.method=="DELETE"){
        const id = req.url.split('/').pop();
        await Post.findByIdAndDelete(id);
        res.writeHead(200,headers);
        res.write(JSON.stringify({
            "status": "success",
            "data": null,
            "message": "刪除單筆資料成功"
        }));
        res.end();
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
              res.writeHead(200, headers);
              res.write(
                JSON.stringify({
                  "status": "success",
                  "data": updatedPost,
                  "message": "更新單筆資料成功",
                })
              );
            } else {
              res.writeHead(404, headers);
              res.write(
                JSON.stringify({
                  status: "error",
                  message: "沒有找到該 id",
                })
              );
            }
            res.end();
          } catch {
            res.writeHead(400, headers);
            res.write(
              JSON.stringify({
                status: "error",
                message: "請求處理失敗",
                error: err.message,
              })
            );
            console.error(err);
            res.end();
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