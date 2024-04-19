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

function checkFieldsNotEmpty(data, fields) {
  for (const field of fields) {
      if (data[field] && data[field].trim().length === 0) {
          return `欄位 ${field} 不能為空`;
      }
  }
  return null; // 如果所有欄位都不為空，則返回 null
}

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
                if(data){

                  // 假設你想要檢查 'name' 和 'content' 欄位
                  const fieldsToCheck = ['name', 'content'];

                  // 使用 checkFieldsNotEmpty 函數來檢查這些欄位
                  const errorMessage = checkFieldsNotEmpty(data, fieldsToCheck);
                  if (errorMessage) {
                      handleError(res, '內容不得為空');
                      return;
                  }

                  // 定義允許的欄位列表
                  const allowedFields = ['name', 'content','image','likes'];

                  // 檢查提供的數據是否只包含了允許的欄位
                  const invalidFields = Object.keys(data).filter(key => !allowedFields.includes(key));
                  if (invalidFields.length > 0) {
                      handleError(res, `不允許的欄位: ${invalidFields.join(', ')}`);
                      return;
                  }

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

        // 檢查 ID 是否存在
        if (!mongoose.Types.ObjectId.isValid(id)) {
          handleError(res, 'ID 格式不正確');
          return;
        }
        
        // 檢查 ID 是否存在
        const post = await Post.findById(id);
        if (!post) {
            handleError(res, 'ID 不存在');
            return;
        }

        await Post.findByIdAndDelete(id);
        handleSuccess(res, null, '刪除單筆資料成功');
    }else if (req.url.startsWith("/posts/") && req.method == "PATCH") {
        req.on("end", async () => {
          try {
            const id = req.url.split("/")[2];
            const data = JSON.parse(body);

            // 檢查 ID 是否存在
            if (!mongoose.Types.ObjectId.isValid(id)) {
              handleError(res, 'ID 格式不正確');
              return;
            }

            // 檢查 ID 是否存在
            const post = await Post.findById(id);
            if (!post) {
                handleError(res, 'ID 不存在');
                return;
            }

            // 假設你想要檢查 'name' 和 'content' 欄位
            const fieldsToCheck = ['name', 'content','image','likes'];

            // 使用 checkFieldsNotEmpty 函數來檢查這些欄位
            const errorMessage = checkFieldsNotEmpty(data, fieldsToCheck);
            if (errorMessage) {
                handleError(res, '內容不得為空');
                return;
            }

            // 定義允許的欄位列表
            const allowedFields = ['name', 'content'];

            // 檢查提供的數據是否只包含了允許的欄位
            const invalidFields = Object.keys(data).filter(key => !allowedFields.includes(key));
            if (invalidFields.length > 0) {
                handleError(res, `不允許的欄位: ${invalidFields.join(', ')}`);
                return;
            }

            // 檢查提供的數據是否與數據庫中的數據不同
            let hasChanged = false;
            if (data.name && data.name !== post.name) {
                hasChanged = true;
            }
            if (data.content && data.content !== post.content) {
                hasChanged = true;
            }

            if (!hasChanged) {
                handleError(res, '數據未變更');
                return;
            }

            // 只有當數據真的有改變時，才進行更新
            const update = {};
            if (data.name) {
                update.name = data.name;
            }
            if (data.content) {
                update.content = data.content;
            }

            const updatedPost = await Post.findByIdAndUpdate(
                id,
                update,
                { new: true }
            );

            if (updatedPost) {
                handleSuccess(res, updatedPost, '更新單筆資料成功');
            } else {
                handleError(res, '更新失敗');
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