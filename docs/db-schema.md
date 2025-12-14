//// ===== Enums =====

Enum user_role {
  USER
  ADMIN
}

Enum post_category {
  GENERAL
  NOTICE
  QNA
  FREE
}

Enum comment_status {
  NORMAL
  REPORTED
  HIDDEN
}

//// ===== Tables =====

Table users {
  id            bigint [pk, increment]
  email         varchar(255) [not null, unique]
  password_hash varchar(255) [not null]
  name          varchar(100) [not null]
  role          user_role [not null, default: 'USER']
  is_active     boolean [not null, default: true]
  created_at    datetime [not null, default: `CURRENT_TIMESTAMP`]
  updated_at    datetime [not null, default: `CURRENT_TIMESTAMP`]

  Indexes {
    (email)
    (role)
  }
}

Table posts {
  id          bigint [pk, increment]
  author_id   bigint [not null]
  title       varchar(200) [not null]
  content     text [not null]
  category    post_category [not null, default: 'GENERAL']
  like_count  int [not null, default: 0] // 캐시용
  is_deleted  boolean [not null, default: false]
  created_at  datetime [not null, default: `CURRENT_TIMESTAMP`]
  updated_at  datetime [not null, default: `CURRENT_TIMESTAMP`]

  Indexes {
    (author_id)
    (category, created_at)
    (created_at)
  }
}

Table comments {
  id             bigint [pk, increment]
  post_id        bigint [not null]
  author_id      bigint [not null]
  content        text [not null]
  status         comment_status [not null, default: 'NORMAL']
  report_reason  varchar(255)
  is_deleted     boolean [not null, default: false]
  created_at     datetime [not null, default: `CURRENT_TIMESTAMP`]
  updated_at     datetime [not null, default: `CURRENT_TIMESTAMP`]

  Indexes {
    (post_id)
    (author_id)
    (status)
    (created_at)
  }
}

Table post_likes {
  post_id     bigint [not null, pk]
  user_id     bigint [not null, pk]
  created_at  datetime [not null, default: `CURRENT_TIMESTAMP`]

  Indexes {
    (user_id)
  }
}

Table refresh_tokens {
  id           bigint [pk, increment]
  user_id      bigint [not null]
  token        varchar(500) [not null]
  expires_at   datetime [not null]
  revoked      boolean [not null, default: false]
  created_at   datetime [not null, default: `CURRENT_TIMESTAMP`]

  Indexes {
    (user_id)
    (token)
  }
}

//// ===== Relations =====

Ref: posts.author_id > users.id

Ref: comments.post_id > posts.id
Ref: comments.author_id > users.id

Ref: post_likes.post_id > posts.id
Ref: post_likes.user_id > users.id

Ref: refresh_tokens.user_id > users.id
