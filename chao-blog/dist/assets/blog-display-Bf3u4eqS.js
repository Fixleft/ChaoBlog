import { r as f, j as e } from "./framer-TAp2EHm1.js";
import { C as v, a as k, b as C, d as L } from "./index-ufr3Enzw.js";
import { B as S, T as y } from "./badge-DFbQIXjU.js";
import { g as D } from "./api-D06cBC0f.js";
import { G as M, C as V } from "./calendar-KFbTPfLS.js";
import { F as $ } from "./button1-pze4i3W1.js";
import { N as A } from "./nav-37Khq6Kl.js";
import { N as n } from "./number-ticker-BpJqz8Us.js";
import { L as B } from "./index-DNux_Z8B.js";
import "./react-Csw2ODfV.js";
import "./index-De41xqz2.js";

function F(a) {
  return new Date(a).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function z(a) {
  const totalArticles = a.length;
  const totalWords = a.reduce(
    (sum, item) => sum + item.content.replace(/\s+/g, "").length,
    0
  );
  const totalMonths = new Set(
    a.map(
      (item) =>
        `${new Date(item.created_at).getFullYear()}-${String(
          new Date(item.created_at).getMonth() + 1
        ).padStart(2, "0")}`
    )
  ).size;
  return { totalArticles, totalWords, totalMonths };
}

const P = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
];

function J() {
  const [a, setA] = f.useState([]);
  const now = new Date();
  const year = now.getFullYear();
  const monthStr = String(now.getMonth() + 1).padStart(2, "0");
  const dayStr = String(now.getDate()).padStart(2, "0");
  const month = parseInt(monthStr, 10);
  const day = Number(dayStr);
  
  f.useEffect(() => {
    D().then(setA);
  }, []);
  const statsSafe = a && a.length ? z(a) : { totalArticles: 0, totalWords: 0, totalMonths: 0 };

  const stats = z(a);
 
  const grouped = a.reduce((acc, item) => {
    const dateKey = `${new Date(item.created_at).getFullYear()}-${String(
      new Date(item.created_at).getMonth() + 1
    ).padStart(2, "0")}`;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  const sortedEntries = Object.entries(grouped).sort(([a], [b]) =>
    b.localeCompare(a)
  );

  return e.jsxs(f.Fragment, {
    children: [
      // 导航栏铺满屏幕
      e.jsx(A, { className: "w-full" }),

      // 页面内容容器
      e.jsxs("div", {
        className: "container mx-auto px-4 pb-8 max-w-6xl",
        children: [
          // 可选控件，例如日历和按钮
          e.jsx(M, {}),
          e.jsx($, {}),
            
          // 统计信息
         // 统计信息安全渲染

e.jsxs("div", {
  className: "mb-8 space-y-6 pt-24",
  children: [
    // 截止日期
    e.jsx("div", {
      className: "flex items-center justify-between mb-4",
      children: e.jsxs("div", {
        className: "flex items-center gap-4",
        children: [
          e.jsx("div", {
            className: "flex items-center gap-2",
            children: e.jsxs("span", {
              className: "text-2xl font-bold",
              children: [
                "截止  ",
                e.jsx(n, {
                  value: year || 0,
                  startValue: 0,
                  className:
                    "whitespace-pre-wrap text-3xl tracking-tighter text-orange-400 dark:text-[#8859eb]",
                }),
                " 年",
              ],
            }),
          }),
          e.jsx("div", {
            className: "flex items-center gap-2",
            children: e.jsxs("span", {
              className: "text-2xl font-bold",
              children: [
                e.jsx(n, {
                  value: month || 0,
                  startValue: 0,
                  className:
                    "whitespace-pre-wrap text-3xl tracking-tighter text-orange-400 dark:text-[#8859eb]",
                }),
                " 月",
              ],
            }),
          }),
          e.jsx("div", {
            className: "flex items-center gap-2",
            children: e.jsxs("span", {
              className: "text-2xl font-bold",
              children: [
                e.jsx(n, {
                  value: day || 0,
                  startValue: 0,
                  className:
                    "whitespace-pre-wrap text-3xl tracking-tighter text-orange-400 dark:text-[#8859eb]",
                }),
                " 日",
              ],
            }),
          }),
        ],
      }),
    }),

    // 上传统计
    e.jsx("div", {
      className: "flex items-center justify-between pb-6 mb-6 border-b-2 border-slate-700",
      children: e.jsxs("div", {
        className: "flex items-center gap-4",
        children: [
          // 总笔记数
          e.jsx("div", {
            className: "flex items-center gap-2",
            children: e.jsxs("span", {
              className: "text-2xl font-bold",
              children: [
                "我已经上传了 ",
                e.jsx(n, {
                  value: statsSafe.totalArticles || 0,
                  startValue: 0,
                  className:
                    "whitespace-pre-wrap text-3xl tracking-tighter text-orange-400 dark:text-[#8859eb]",
                }),
                " 篇笔记",
              ],
            }),
          }),
          // 总字数
          e.jsx("div", {
            className: "flex items-center gap-2",
            children: e.jsxs("span", {
              className: "text-2xl font-bold",
              children: [
                "共 ",
                e.jsx(n, {
                  value: statsSafe.totalWords || 0,
                  startValue: 0,
                  className:
                    "whitespace-pre-wrap text-3xl tracking-tighter text-orange-400 dark:text-[#8859eb]",
                }),
                " 字",
              ],
            }),
          }),
          // 跨越月份
          e.jsx("div", {
            className: "flex items-center gap-2",
            children: e.jsxs("span", {
              className: "text-2xl font-bold",
              children: [
                "时间跨越 ",
                e.jsx(n, {
                  value: statsSafe.totalMonths || 0,
                  startValue: 0,
                  className:
                    "whitespace-pre-wrap text-3xl tracking-tighter text-orange-400 dark:text-[#8859eb]",
                }),
                " 个月",
              ],
            }),
          }),
        ],
      }),
    }),
  ],
}),

          // 每月文章循环
          sortedEntries.map(([key, posts]) => {
            const [yearStr, monthStr] = key.split("-");
            const monthIndex = parseInt(monthStr, 10);

            return e.jsxs(
              "div",
              {
                className: "mb-12 space-y-6",
                children: [
                  e.jsxs("div", {
                    className: "flex items-center gap-3 mb-16",
                    children: [
                      e.jsx(V, { className: "text-black w-6 h-6 dark:text-white" }),
                      e.jsxs("h2", {
                        className: "text-4xl font-bold",
                        children: [yearStr, "年 ", P[monthIndex - 1]],
                      }),
                    ],
                  }),
                  e.jsx(
                    "div",
                    {
                      className: "grid gap-6 grid-cols-1 ",
                      children: posts.map((post, index) =>
                        e.jsx(
                          B,
                          {
                            to: `/posts/${post.id}`,
                            children: e.jsx(
                              v,
                              {
                                className:
                                  "hover:shadow-lg transition-shadow cursor-pointer bg-white/90 p-0 overflow-hidden dark:bg-black/90",
                                children: e.jsxs("div", {
                                  className: `flex flex-col md:flex-row ${
                                    index % 2 === 1 ? "md:flex-row-reverse" : ""
                                  }`,
                                  children: [
                                    e.jsxs("div", {
                                      className: "w-full md:w-[60%] p-6",
                                      children: [
                                        e.jsxs(k, {
                                          className: "p-0 mb-4",
                                          children: [
                                            e.jsx(C, {
                                              className:
                                                "text-2xl font-bold text-slate-800 hover:text-[#8859eb] transition-colors dark:text-white line-clamp-2",
                                              children: post.title,
                                            }),
                                            e.jsxs("p", {
                                              className:
                                                "text-sm text-slate-500 mt-2 flex items-center gap-1 flex-wrap",
                                              children: [
                                                e.jsx("svg", {
                                                  "aria-hidden": "true",
                                                  focusable: "false",
                                                  className:
                                                    "w-4 h-4 transition-colors dark:text-white",
                                                  role: "img",
                                                  xmlns: "http://www.w3.org/2000/svg",
                                                  viewBox: "0 0 640 640",
                                                  children: e.jsx("path", {
                                                    fill: "currentColor",
                                                    d: "M224 64C206.3 64 192 78.3 192 96L192 128L160 128C124.7 128 96 156.7 96 192L96 240L544 240L544 192C544 156.7 515.3 128 480 128L448 128L448 96C448 78.3 433.7 64 416 64C398.3 64 384 78.3 384 96L384 128L256 128L256 96C256 78.3 241.7 64 224 64zM96 288L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 288L96 288z",
                                                  }),
                                                }),
                                                "Created ",
                                                F(post.created_at),
                                              ],
                                            }),
                                            e.jsx("div", {
                                              className: "mt-2 flex flex-wrap gap-2",
                                              children: post.tags.map((tag) =>
                                                e.jsxs(
                                                  S,
                                                  {
                                                    variant: "secondary",
                                                    className:
                                                      "text-xs bg-slate-100 text-slate-600 hover:bg-slate-200",
                                                    children: [
                                                      e.jsx(y, {
                                                        className: "w-3 h-3 mr-1",
                                                      }),
                                                      tag,
                                                    ],
                                                  },
                                                  tag
                                                )
                                              ),
                                            }),
                                          ],
                                        }),
                                        e.jsx(L, {
                                          className: "p-0 mt-4",
                                          children: e.jsxs("p", {
                                            className:
                                              "text-sm text-gray-700 line-clamp-3 dark:text-white",
                                            children: [
                                              post.content
                                                .replace(/[#>*`-]/g, "")
                                                .slice(0, 200),
                                              "...",
                                            ],
                                          }),
                                        }),
                                      ],
                                    }),
                                    e.jsx("div", {
                                      className:
                                        "hidden md:block w-[40%] bg-gradient-to-br from-blue-300 via-purple-300 to-pink-100",
                                    }),
                                  ],
                                }),
                              }
                            ),
                          },
                          post.id
                        )
                      ),
                    }
                  ),
                ],
              },
              key
            );
          }),
        ],
      }),
    ],
  });
}


export { J as default };
