const express = require("express");
const router = express.Router();

let todos = [
  { id: 1, title: "todo1", done: false },
  { id: 2, title: "todo2", done: true },
];
let nextTodoId = 3;

function ok(res, statusCode, data, message = "success") {
  return res.status(statusCode).json({ status: "success", data, message });
}
function fail(res, statusCode, message = "error") {
  return res.status(statusCode).json({ status: "error", data: null, message });
}

router.put("/:id", (req, res, next) => {
  const id = Number(req.params.id);
  const { title, done } = req.body;

  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) return fail(res, 404, "Todo not found");

  if (typeof title !== "string" || typeof done !== "boolean") {
    return fail(res, 400, "title and done are required");
  }

  // 서비스 점검(503) 테스트용: 제목이 "maintenance"면 503 응답
  if (title === "maintenance") {
    const err = new Error("Service under maintenance");
    err.type = "SERVICE_UNAVAILABLE";
    return next(err);
  }

  const updated = { id, title, done };
  todos[idx] = updated;

  return ok(res, 200, updated, "Todo updated");
});

module.exports = router;