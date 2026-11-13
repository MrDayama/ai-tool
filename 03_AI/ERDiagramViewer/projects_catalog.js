window.PROJECTS_CATALOG = {
  "total_projects": 2,
  "projects": [
    {
      "id": "example_schema",
      "name": "AIタスク＆プロジェクト統合管理システム",
      "description": "単一のJSONスキーマ定義から全ドキュメント・図・コード型を生成する実践サンプル",
      "file_path": "C:\\work\\ai\\ai-tool\\03_AI\\SchemaDrivenDevelopment\\example_schema.json",
      "relative_path": "03_AI\\SchemaDrivenDevelopment\\example_schema.json",
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "system_info": {
          "name": "AIタスク＆プロジェクト統合管理システム",
          "description": "単一のJSONスキーマ定義から全ドキュメント・図・コード型を生成する実践サンプル",
          "version": "1.2.0"
        },
        "entities": [
          {
            "name": "Project",
            "description": "プロジェクト単位の情報",
            "fields": [
              {
                "name": "id",
                "type": "string",
                "primaryKey": true,
                "description": "プロジェクトID"
              },
              {
                "name": "name",
                "type": "string",
                "required": true,
                "description": "プロジェクト名"
              },
              {
                "name": "budget",
                "type": "number",
                "description": "予算（千円）"
              },
              {
                "name": "created_at",
                "type": "datetime",
                "required": true,
                "description": "作成日時"
              }
            ],
            "relations": [
              {
                "target": "Task",
                "type": "one_to_many",
                "foreignKey": "project_id",
                "label": "含む"
              },
              {
                "target": "Member",
                "type": "many_to_many",
                "foreignKey": "project_id",
                "label": "参加メンバー"
              }
            ]
          },
          {
            "name": "Task",
            "description": "個別のタスク項目",
            "fields": [
              {
                "name": "id",
                "type": "string",
                "primaryKey": true,
                "description": "タスクID"
              },
              {
                "name": "project_id",
                "type": "string",
                "foreignKey": true,
                "description": "所属プロジェクトID"
              },
              {
                "name": "assignee_id",
                "type": "string",
                "foreignKey": true,
                "description": "担当者MemberID"
              },
              {
                "name": "title",
                "type": "string",
                "required": true,
                "description": "タスクタイトル"
              },
              {
                "name": "status",
                "type": "enum",
                "options": [
                  "BACKLOG",
                  "TODO",
                  "IN_PROGRESS",
                  "REVIEW",
                  "DONE"
                ],
                "description": "作業状態"
              },
              {
                "name": "priority",
                "type": "enum",
                "options": [
                  "LOW",
                  "MEDIUM",
                  "HIGH",
                  "URGENT"
                ],
                "description": "優先度"
              }
            ],
            "relations": [
              {
                "target": "Comment",
                "type": "one_to_many",
                "foreignKey": "task_id",
                "label": "コメント"
              }
            ]
          },
          {
            "name": "Member",
            "description": "プロジェクトに参加するメンバー",
            "fields": [
              {
                "name": "id",
                "type": "string",
                "primaryKey": true,
                "description": "メンバーID"
              },
              {
                "name": "name",
                "type": "string",
                "required": true,
                "description": "氏名"
              },
              {
                "name": "role",
                "type": "enum",
                "options": [
                  "ADMIN",
                  "DEVELOPER",
                  "DESIGNER",
                  "VIEWER"
                ],
                "description": "役割権限"
              }
            ],
            "relations": [
              {
                "target": "Task",
                "type": "one_to_many",
                "foreignKey": "assignee_id",
                "label": "担当タスク"
              }
            ]
          },
          {
            "name": "Comment",
            "description": "タスクに対するディスカッションログ",
            "fields": [
              {
                "name": "id",
                "type": "string",
                "primaryKey": true,
                "description": "コメントID"
              },
              {
                "name": "task_id",
                "type": "string",
                "foreignKey": true,
                "description": "対象タスクID"
              },
              {
                "name": "author_id",
                "type": "string",
                "foreignKey": true,
                "description": "投稿者ID"
              },
              {
                "name": "content",
                "type": "text",
                "required": true,
                "description": "コメント本文"
              },
              {
                "name": "posted_at",
                "type": "datetime",
                "required": true,
                "description": "投稿日時"
              }
            ],
            "relations": []
          }
        ],
        "concepts": [
          {
            "name": "プロジェクトダッシュボードモジュール",
            "layer": "Presentation Layer",
            "depends_on": [
              "TaskService",
              "ProjectService"
            ]
          },
          {
            "name": "TaskService",
            "layer": "Domain Service Layer",
            "depends_on": [
              "Task",
              "Comment",
              "NotificationService"
            ]
          },
          {
            "name": "ProjectService",
            "layer": "Domain Service Layer",
            "depends_on": [
              "Project",
              "Member"
            ]
          },
          {
            "name": "NotificationService",
            "layer": "Infrastructure Layer",
            "depends_on": [
              "Member"
            ]
          }
        ],
        "workflows": [
          {
            "id": "task_progress_workflow",
            "name": "タスク作業進行およびレビューフロー",
            "actor": "開発メンバー",
            "steps": [
              {
                "id": "start",
                "action": "TODOタスクを選択し「着手」ボタンを押す",
                "next": "status_in_progress"
              },
              {
                "id": "status_in_progress",
                "action": "ステータスを IN_PROGRESS に変更し作業開始",
                "next": "submit_review"
              },
              {
                "id": "submit_review",
                "action": "成果物を添付して「レビュー依頼」を送信",
                "next": "check_approval"
              },
              {
                "id": "check_approval",
                "action": "レビュアーによる内容確認",
                "condition": true,
                "on_success": "status_done",
                "on_failure": "reject_task"
              },
              {
                "id": "reject_task",
                "action": "修正コメントを追加し修正依頼通知",
                "target_entity": "Comment",
                "next": "status_in_progress"
              },
              {
                "id": "status_done",
                "action": "ステータスを DONE に変更し完了",
                "target_entity": "Task",
                "next": "end"
              }
            ]
          }
        ],
        "ui_screens": [
          {
            "id": "screen_project_kanban",
            "name": "プロジェクトカンバンボード画面",
            "path": "/projects/:id/kanban",
            "entities_used": [
              "Project",
              "Task",
              "Member"
            ],
            "components": [
              {
                "name": "ProjectHeader",
                "type": "Header",
                "description": "プロジェクト名・メンバー一覧・進捗メーター"
              },
              {
                "name": "KanbanColumnList",
                "type": "GridContainer",
                "description": "BACKLOG/TODO/IN_PROGRESS/REVIEW/DONE の5カラム"
              },
              {
                "name": "TaskCard",
                "type": "CardComponent",
                "description": "タスク名・担当者アバター・優先度バッジ・期限"
              },
              {
                "name": "TaskDetailDrawer",
                "type": "Drawer",
                "description": "タスク詳細表示およびコメント投稿エリア"
              }
            ]
          }
        ]
      }
    },
    {
      "id": "schema_template",
      "name": "システム名テンプレート",
      "description": "システム概要説明",
      "file_path": "C:\\work\\ai\\ai-tool\\03_AI\\SchemaDrivenDevelopment\\schema_template.json",
      "relative_path": "03_AI\\SchemaDrivenDevelopment\\schema_template.json",
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "system_info": {
          "name": "システム名テンプレート",
          "description": "システム概要説明",
          "version": "1.0.0"
        },
        "entities": [
          {
            "name": "User",
            "description": "ユーザー情報",
            "fields": [
              {
                "name": "id",
                "type": "string",
                "primaryKey": true,
                "description": "ユーザーID"
              },
              {
                "name": "name",
                "type": "string",
                "required": true,
                "description": "氏名"
              },
              {
                "name": "email",
                "type": "string",
                "required": true,
                "description": "メールアドレス"
              },
              {
                "name": "created_at",
                "type": "datetime",
                "required": true,
                "description": "登録日時"
              }
            ],
            "relations": [
              {
                "target": "Task",
                "type": "one_to_many",
                "foreignKey": "user_id",
                "label": "所有する"
              }
            ]
          },
          {
            "name": "Task",
            "description": "タスク情報",
            "fields": [
              {
                "name": "id",
                "type": "string",
                "primaryKey": true,
                "description": "タスクID"
              },
              {
                "name": "user_id",
                "type": "string",
                "foreignKey": true,
                "description": "担当ユーザーID"
              },
              {
                "name": "title",
                "type": "string",
                "required": true,
                "description": "タスク名"
              },
              {
                "name": "status",
                "type": "enum",
                "options": [
                  "TODO",
                  "IN_PROGRESS",
                  "DONE"
                ],
                "description": "進捗ステータス"
              },
              {
                "name": "due_date",
                "type": "date",
                "description": "期日"
              }
            ],
            "relations": []
          }
        ],
        "concepts": [
          {
            "name": "ユーザー管理コンポーネント",
            "layer": "Domain Layer",
            "depends_on": [
              "認証サービス",
              "User"
            ]
          },
          {
            "name": "タスク管理コンポーネント",
            "layer": "Domain Layer",
            "depends_on": [
              "Task",
              "ユーザー管理コンポーネント"
            ]
          }
        ],
        "workflows": [
          {
            "id": "workflow_create_task",
            "name": "新規タスク作成フロー",
            "actor": "ユーザー",
            "steps": [
              {
                "id": "step1",
                "action": "タスク作成ボタンを押す",
                "next": "step2"
              },
              {
                "id": "step2",
                "action": "フォーム入力（タイトル・期日）",
                "next": "step3"
              },
              {
                "id": "step3",
                "action": "入力内容のバリデーション",
                "condition": true,
                "on_success": "step4",
                "on_failure": "step2"
              },
              {
                "id": "step4",
                "action": "Taskデータベースへ保存",
                "target_entity": "Task",
                "next": "end"
              }
            ]
          }
        ],
        "ui_screens": [
          {
            "id": "screen_task_list",
            "name": "タスク一覧画面",
            "path": "/tasks",
            "entities_used": [
              "Task",
              "User"
            ],
            "components": [
              {
                "name": "TaskHeader",
                "type": "Header",
                "description": "ユーザー情報と検索バー"
              },
              {
                "name": "TaskListTable",
                "type": "Table",
                "description": "タスクカードの一覧表示"
              },
              {
                "name": "CreateTaskModal",
                "type": "Modal",
                "description": "新規タスク入力ダイアログ"
              }
            ]
          }
        ]
      }
    }
  ]
};
