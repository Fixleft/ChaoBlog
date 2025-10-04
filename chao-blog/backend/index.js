const express = require("express")
const cors = require("cors")
const multer = require("multer")
const mysql = require("mysql2/promise")
const { Client } = require("minio")
const fs = require("fs")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const sharp = require("sharp")
const https = require('https');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express()
const port = 3001
const Localhost = "www.chaosama.asia"
app.use(cors())
app.use(express.json())
const JWT_SECRET = "超sama"
// MinIO 配置
const minioClient = new Client({
  endPoint: "127.0.0.1",
  port: 9000,
  useSSL: true,
  accessKey: "minioadmin",
  secretKey: "minioadmin",
})
const BUCKET = "chaosama"

minioClient.bucketExists(BUCKET, (err) => {
  if (err) {
    minioClient.makeBucket(BUCKET).then(() => console.log("Bucket created"))
  }
})



// MySQL 连接池
const pool = mysql.createPool({
  host: "chaosama.asia",
  user: "chaosama",
  password: "LzdZ2hcLcX5jtKyN",
  database: "chaosama",
})

// 临时上传文件夹
const upload = multer({ dest: "uploads/" })

// 上传接口
app.post("/upload", upload.array("photos"), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    for (const file of req.files) {
      // 先用 sharp 压缩、转 webp 格式（或 jpeg）
      const processedBuffer = await sharp(file.path)
        .resize({ width: 1024 }) // 限制最大宽度 1024px，可调整
        .webp({ quality: 80 }) // 转 webp 格式，质量80
        .toBuffer();

      const id = Date.now() + "_" + file.originalname.replace(/\.[^/.]+$/, "") + ".webp";
    

      // 直接上传 Buffer 到 MinIO
      await minioClient.putObject(BUCKET, id, processedBuffer);

      // 插入数据库，文件大小是压缩后大小
      await conn.execute(
        "INSERT INTO photos (id, fileName, fileSize, uploadDate) VALUES (?, ?, ?, NOW())",
        [id, id, processedBuffer.length]
      );

      // 删除本地临时文件
      fs.unlinkSync(file.path);
    }
    res.send({ success: true });
  } catch (err) {
    console.error("上传处理错误", err);
    res.status(500).send({ success: false, message: "上传失败" });
  } finally {
    conn.release();
  }
});


// 获取所有照片
app.get("/photos", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM photos ORDER BY uploadDate DESC")
  const result = rows.map((row) => ({
    ...row,
    url: `https://${Localhost}:9000/${BUCKET}/${row.id}`,
  }))
  res.json(result)
})

// 删除照片
app.delete("/photos/:id", async (req, res) => {
  const { id } = req.params
  await pool.execute("DELETE FROM photos WHERE id = ?", [id])
  await minioClient.removeObject(BUCKET, id)
  res.send({ success: true })
})
//发布文章
app.post("/posts", authenticateToken, async (req, res) => {
  const { title, content, tags = [] } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      "INSERT INTO posts (title, content) VALUES (?, ?)",
      [title, content]
    );
    const postId = result.insertId;

    for (const tagName of tags) {
      // 插入新标签（如果不存在）
      const [tagRows] = await conn.execute("SELECT id FROM tags WHERE name = ?", [tagName]);
      let tagId;
      if (tagRows.length > 0) {
        tagId = tagRows[0].id;
      } else {
        const [tagInsert] = await conn.execute("INSERT INTO tags (name) VALUES (?)", [tagName]);
        tagId = tagInsert.insertId;
      }
      // 建立文章-标签关系
      await conn.execute("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)", [postId, tagId]);
    }

    await conn.commit();
    res.json({ success: true, postId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: "发布失败", error: err.message });
  } finally {
    conn.release();
  }
});
//删除文章
app.delete("/posts/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. 删除与该文章相关的标签关系
    await conn.execute("DELETE FROM post_tags WHERE post_id = ?", [id]);

    // 2. 删除文章
    await conn.execute("DELETE FROM posts WHERE id = ?", [id]);

    // 3. 删除所有未被任何文章使用的标签
    await conn.execute(`
      DELETE FROM tags 
      WHERE id NOT IN (SELECT DISTINCT tag_id FROM post_tags)
    `);

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: "删除失败", error: err.message });
  } finally {
    conn.release();
  }
});

//编辑文章（更新标签）
app.put("/posts/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, content, tags = [] } = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    await conn.execute("UPDATE posts SET title = ?, content = ? WHERE id = ?", [title, content, id]);

    // 删除原标签关系
    await conn.execute("DELETE FROM post_tags WHERE post_id = ?", [id]);

    for (const tagName of tags) {
      const [tagRows] = await conn.execute("SELECT id FROM tags WHERE name = ?", [tagName]);
      let tagId;
      if (tagRows.length > 0) {
        tagId = tagRows[0].id;
      } else {
        const [tagInsert] = await conn.execute("INSERT INTO tags (name) VALUES (?)", [tagName]);
        tagId = tagInsert.insertId;
      }
      await conn.execute("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)", [id, tagId]);
    }

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: "更新失败", error: err.message });
  } finally {
    conn.release();
  }
});
//获取文章列表（含标签）
app.get("/posts", async (req, res) => {
  const [posts] = await pool.query("SELECT * FROM posts ORDER BY created_at DESC");

  for (const post of posts) {
    const [tagRows] = await pool.query(
      `SELECT t.name FROM tags t
       JOIN post_tags pt ON t.id = pt.tag_id
       WHERE pt.post_id = ?`,
      [post.id]
    );
    post.tags = tagRows.map((t) => t.name);
  }

  res.json(posts);
});
// 获取单篇文章（含标签）
app.get("/posts/:id", async (req, res) => {
  const postId = req.params.id;

  const [[post]] = await pool.query("SELECT * FROM posts WHERE id = ?", [postId]);
  if (!post) return res.status(404).json({ message: "文章不存在" });

  const [tagRows] = await pool.query(
    `SELECT t.name FROM tags t
     JOIN post_tags pt ON t.id = pt.tag_id
     WHERE pt.post_id = ?`,
    [postId]
  );
  post.tags = tagRows.map((t) => t.name);

  res.json(post);
});

//按标签查找文章
app.get("/posts/by-tag/:tag", async (req, res) => {
  const { tag } = req.params;
  const [rows] = await pool.query(
    `SELECT p.* FROM posts p
     JOIN post_tags pt ON p.id = pt.post_id
     JOIN tags t ON pt.tag_id = t.id
     WHERE t.name = ?
     ORDER BY p.created_at DESC`,
    [tag]
  );

  for (const post of rows) {
    const [tagRows] = await pool.query(
      `SELECT t.name FROM tags t
       JOIN post_tags pt ON t.id = pt.tag_id
       WHERE pt.post_id = ?`,
      [post.id]
    );
    post.tags = tagRows.map((t) => t.name);
  }

  res.json(rows);
});
//获取标签列表
app.get("/tags", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        t.id, 
        t.name, 
        COUNT(pt.post_id) AS count
      FROM tags t
      LEFT JOIN post_tags pt ON t.id = pt.tag_id
      GROUP BY t.id, t.name
      ORDER BY count DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("获取标签失败：", err);
    res.status(500).json({ error: "获取标签失败" });
  }
});
//获取专辑
app.get('/albums', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM albums ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error('获取专辑失败', err);
    res.status(500).json({ error: '数据库查询失败' });
  }
});
//上传专辑
app.post('/albums', async (req, res) => {
  const { name, author, href, img } = req.body;
  if (!name || !author || !href || !img) {
    return res.status(400).json({ error: '字段不能为空' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO albums (name, author, href, img) VALUES (?, ?, ?, ?)',
      [name, author, href, img]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    console.error('插入专辑失败', err);
    res.status(500).json({ error: '数据库错误' });
  }
});
//删除专辑
app.delete('/albums/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM albums WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '未找到该专辑' });
    }
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除专辑失败', err);
    res.status(500).json({ error: '数据库错误' });
  }
});

// 登录接口
app.post("/login", async (req, res) => {
  const { username, password } = req.body
  if (username !== "554640824") {
    return res.status(401).json({ success: false, message: "用户不存在" })
  }

  // 从数据库查询用户密码哈希（假设存在 users 表）
  const [rows] = await pool.query("SELECT password FROM admin_users WHERE username = ?", [username])
  if (rows.length === 0) {
    return res.status(401).json({ success: false, message: "用户不存在" })
  }

  const user = rows[0]
  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    return res.status(401).json({ success: false, message: "密码错误" })
  }

  // 生成 token（载荷可以放用户名、id等）
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "2h" })

  res.json({ success: true, token, message: "登录成功" })
})

// 验证 token 中间件（保护接口用）
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]
  if (!token) return res.status(401).json({ success: false, message: "未提供 token" })

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: "token 无效" })
    req.user = user
    next()
  })
}

// 示例测试接口
app.get("/hello", (req, res) => {
  res.json({ message: "Hello HTTP World!" });
});

// 监听端口启动服务
app.listen(port, () => {
  console.log(`Node.js server running at http://localhost:${port}`);
});