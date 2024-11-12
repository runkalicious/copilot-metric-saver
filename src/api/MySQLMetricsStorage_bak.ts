import { createConnection, Connection } from 'mysql2/promise';
import { IMetricsStorage } from './IMetricsStorage';
import {CopilotMetrics,CopilotIdeCodeCompletions} from '../model/Copilot_Metrics';
import { storage_config } from '../../config';
import { Tenant } from '../model/Tenant';

export class MySQLMetricsStorage implements IMetricsStorage {
    private dbConnection: Connection | null = null;
    private scope_name: string = '';
    private type: string = '';
    private team?: string= '';
    private initialized: boolean = false;

    constructor(tenant: Tenant) {
        this.initConnection();
        this.initializeScope(tenant);
        this.initializeDatabase();
    }

    private async initConnection() {
        try {
            this.dbConnection = await createConnection({
                host: storage_config.DB?.HOST,
                user: storage_config.DB?.USER,
                password: storage_config.DB?.PASSWORD,
                database: storage_config.DB?.DATABASE,
                port: storage_config.DB?.PORT,
            });
            console.log('Database connection established successfully in Metrics Module.');
            this.initialized= true;
        } catch (error) {
            console.error('Error connecting to the database:', error);
            this.initialized = false;
        }
       
    }


    public async initializeScope(tenant: Tenant) {
        try {
            this.scope_name = tenant.scopeName;
            this.type = tenant.scopeType;
            this.team = tenant.team;
        } catch (error) {
            console.error('Error initializing Metrics scope:', error);
        }
    }

    private async initializeDatabase() {

        await this.ensureInitialized();
        
        const createMetricsTableQuery = `
            CREATE TABLE IF NOT EXISTS Metrics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                day DATE NOT NULL,
                total_suggestions_count INT NOT NULL,
                total_acceptances_count INT NOT NULL,
                total_lines_suggested INT NOT NULL,
                total_lines_accepted INT NOT NULL,
                total_active_users INT NOT NULL,
                total_chat_acceptances INT DEFAULT 0,
                total_chat_turns INT DEFAULT 0,
                total_active_chat_users INT DEFAULT 0,
                type ENUM('organization','enterprise') NOT NULL,
                scope_name VARCHAR(255) NOT NULL,
                team VARCHAR(255) DEFAULT '',
                UNIQUE KEY unique_day_type_scope_team(day, type, scope_name,team)
            );
        `;

        const createBreakdownDataTableQuery = `
            CREATE TABLE IF NOT EXISTS BreakdownData (
                id INT AUTO_INCREMENT PRIMARY KEY,
                day DATE NOT NULL,
                type ENUM('organization','enterprise') NOT NULL,
                scope_name VARCHAR(255) NOT NULL,
                team VARCHAR(255) DEFAULT '',
                language VARCHAR(255) NOT NULL,
                editor VARCHAR(255) NOT NULL,
                suggestions_count INT NOT NULL,
                acceptances_count INT NOT NULL,
                lines_suggested INT NOT NULL,
                lines_accepted INT NOT NULL,
                active_users INT NOT NULL,
                UNIQUE KEY unique_day_scope_team_lang_ide (day, type, scope_name(50), team(50), language(50), editor(50))
                );
        `;

        await this.dbConnection!.execute(createMetricsTableQuery);
        await this.dbConnection!.execute(createBreakdownDataTableQuery);
        console.log('Database Metrics tables initialized.');
    }

    private async ensureInitialized() {
        if (!this.initialized) {
            console.log('Re-initializing connection in Metrics Module...');
            await this.initConnection();
        }
    }

    public async saveMetrics2(metricsData: CopilotMetrics[],team_slug?:string): Promise<boolean> {
        await this.ensureInitialized();
        if (!team_slug) {
            team_slug = this.team;
        }


    }

    
  public async saveMetrics(metricsData: CopilotMetrics[], team_slug?: string): Promise<boolean> {
    await this.ensureInitialized();
        if (!team_slug) {
            team_slug = this.team;
        }
    const connection = this.dbConnection;
    if (!connection) {
      console.error('Database connection is not initialized.');
      return false;
    }
    try {
      for (const metric of metricsData) {
        const transaction = await connection.beginTransaction();

        try {
          // Insert into copilot_metrics table
          const [metricsResult] = await connection.execute(
            `
            INSERT INTO copilot_metrics (
              date,
              total_active_users,
              total_engaged_users,
              scope_type,
              scope_name,
              team
            ) VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
              metric.date,
              metric.total_active_users,
              metric.total_engaged_users,
              this.type,
              this.scope_name,
              team_slug || '',
            ]
          );

          const metricsId = (metricsResult as any).insertId;

          // Save copilot_ide_code_completions
          if (metric.copilot_ide_code_completions) {
            const copilotIdeCodeCompletions = metric.copilot_ide_code_completions;

            // Insert into copilot_ide_code_completions table
            const [completionResult] = await connection.execute(
              `
              INSERT INTO copilot_ide_code_completions (
                metrics_id,
                total_engaged_users
              ) VALUES (?, ?)
              `,
              [metricsId, copilotIdeCodeCompletions.total_engaged_users]
            );

            const completionId = (completionResult as any).insertId;

            // Insert languages
            for (const language of copilotIdeCodeCompletions.languages) {
              await connection.execute(
                `
                INSERT INTO copilot_ide_code_completions_languages (
                  metrics_id,
                  completion_id,
                  name,
                  total_engaged_users
                ) VALUES (?, ?, ?, ?)
                `,
                [
                  metricsId,
                  completionId,
                  language.name,
                  language.total_engaged_users,
                ]
              );
            }

            // Insert editors
            for (const editor of copilotIdeCodeCompletions.editors) {
              const [editorResult] = await connection.execute(
                `
                INSERT INTO copilot_ide_code_completions_editors (
                  metrics_id,
                  completion_id,
                  name,
                  total_engaged_users
                ) VALUES (?, ?, ?, ?)
                `,
                [
                  metricsId,
                  completionId,
                  editor.name,
                  editor.total_engaged_users,
                ]
              );

              const editorId = (editorResult as any).insertId;

              // Insert models
              for (const model of editor.models) {
                const [modelResult] = await connection.execute(
                  `
                  INSERT INTO copilot_ide_code_completions_editor_models (
                    metrics_id,
                    editor_id,
                    name,
                    is_custom_model,
                    custom_model_training_date,
                    total_engaged_users
                  ) VALUES (?, ?, ?, ?, ?, ?)
                  `,
                  [
                    metricsId,
                    editorId,
                    model.name,
                    model.is_custom_model,
                    model.custom_model_training_date,
                    model.total_engaged_users,
                  ]
                );

                const modelId = (modelResult as any).insertId;

                // Insert model languages
                for (const language of model.languages) {
                  await connection.execute(
                    `
                    INSERT INTO copilot_ide_code_completions_editor_model_languages (
                      metrics_id,
                      model_id,
                      name,
                      total_engaged_users,
                      total_code_suggestions,
                      total_code_acceptances,
                      total_code_lines_suggested,
                      total_code_lines_accepted
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                      metricsId,
                      modelId,
                      language.name,
                      language.total_engaged_users,
                      language.total_code_suggestions,
                      language.total_code_acceptances,
                      language.total_code_lines_suggested,
                      language.total_code_lines_accepted,
                    ]
                  );
                }
              }
            }
          }

          // Save copilot_ide_chat
          if (metric.copilot_ide_chat) {
            const copilotIdeChat = metric.copilot_ide_chat;

            // Insert into copilot_ide_chat table
            const [ideChatResult] = await connection.execute(
              `
              INSERT INTO copilot_ide_chat (
                metrics_id,
                total_engaged_users
              ) VALUES (?, ?)
              `,
              [metricsId, copilotIdeChat.total_engaged_users]
            );

            const ideChatId = (ideChatResult as any).insertId;

            // Insert editors
            for (const editor of copilotIdeChat.editors) {
              const [editorResult] = await connection.execute(
                `
                INSERT INTO copilot_ide_chat_editors (
                  metrics_id,
                  ide_chat_id,
                  name,
                  total_engaged_users
                ) VALUES (?, ?, ?, ?)
                `,
                [
                  metricsId,
                  ideChatId,
                  editor.name,
                  editor.total_engaged_users,
                ]
              );

              const editorId = (editorResult as any).insertId;

              // Insert models
              for (const model of editor.models) {
                await connection.execute(
                  `
                  INSERT INTO copilot_ide_chat_editor_models (
                    metrics_id,
                    editor_id,
                    name,
                    is_custom_model,
                    custom_model_training_date,
                    total_engaged_users,
                    total_chats,
                    total_chat_insertion_events,
                    total_chat_copy_events
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `,
                  [
                    metricsId,
                    editorId,
                    model.name,
                    model.is_custom_model,
                    model.custom_model_training_date,
                    model.total_engaged_users,
                    model.total_chats,
                    model.total_chat_insertion_events,
                    model.total_chat_copy_events,
                  ]
                );
              }
            }
          }

          // Save copilot_dotcom_chat
          if (metric.copilot_dotcom_chat) {
            const copilotDotcomChat = metric.copilot_dotcom_chat;

            // Insert into copilot_dotcom_chat table
            const [dotcomChatResult] = await connection.execute(
              `
              INSERT INTO copilot_dotcom_chat (
                metrics_id,
                total_engaged_users
              ) VALUES (?, ?)
              `,
              [metricsId, copilotDotcomChat.total_engaged_users]
            );

            const dotcomChatId = (dotcomChatResult as any).insertId;

            // Insert models
            for (const model of copilotDotcomChat.models) {
              await connection.execute(
                `
                INSERT INTO copilot_dotcom_chat_models (
                  metrics_id,
                  dotcom_chat_id,
                  name,
                  is_custom_model,
                  custom_model_training_date,
                  total_engaged_users,
                  total_chats
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                  metricsId,
                  dotcomChatId,
                  model.name,
                  model.is_custom_model,
                  model.custom_model_training_date,
                  model.total_engaged_users,
                  model.total_chats,
                ]
              );
            }
          }

          // Save copilot_dotcom_pull_requests
          if (metric.copilot_dotcom_pull_requests) {
            const copilotPRs = metric.copilot_dotcom_pull_requests;

            // Insert into copilot_dotcom_pull_requests table
            const [prResult] = await connection.execute(
              `
              INSERT INTO copilot_dotcom_pull_requests (
                metrics_id,
                total_engaged_users
              ) VALUES (?, ?)
              `,
              [metricsId, copilotPRs.total_engaged_users]
            );

            const prId = (prResult as any).insertId;

            // Insert repositories
            for (const repo of copilotPRs.repositories) {
              const [repoResult] = await connection.execute(
                `
                INSERT INTO copilot_dotcom_pull_requests_repositories (
                  metrics_id,
                  pull_requests_id,
                  name,
                  total_engaged_users
                ) VALUES (?, ?, ?, ?)
                `,
                [
                  metricsId,
                  prId,
                  repo.name,
                  repo.total_engaged_users,
                ]
              );

              const repoId = (repoResult as any).insertId;

              // Insert models
              for (const model of repo.models) {
                await connection.execute(
                  `
                  INSERT INTO copilot_dotcom_pull_requests_repository_models (
                    metrics_id,
                    repository_id,
                    name,
                    is_custom_model,
                    custom_model_training_date,
                    total_pr_summaries_created,
                    total_engaged_users
                  ) VALUES (?, ?, ?, ?, ?, ?, ?)
                  `,
                  [
                    metricsId,
                    repoId,
                    model.name,
                    model.is_custom_model,
                    model.custom_model_training_date,
                    model.total_pr_summaries_created,
                    model.total_engaged_users,
                  ]
                );
              }
            }
          }

          await connection.commit();
        } catch (error) {
          await connection.rollback();
          console.error('Error saving metrics:', error);
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error('Error in saveMetrics:', err);
      return false;
    }
  }

public async getMetrics(): Promise<CopilotMetrics[]> {
        await this.ensureInitialized();
        console.log('team in readMetricsData:', this.team);
        try {

            // need to check whether the team is null or '', it is null or '' then we need to pass team='' in the query.
            //or, the query should be  incluedes 'and team = ?' in the where clause.
            if (this.team === null || this.team === '') {
                this.team = '';
            }
            const metricsQuery = `
                SELECT day, total_suggestions_count, total_acceptances_count, total_lines_suggested, total_lines_accepted, total_active_users, total_chat_acceptances, total_chat_turns, total_active_chat_users 
                FROM Metrics 
                WHERE type = ? AND scope_name = ? AND team = ?`;
            const breakdownQuery = `
                SELECT day, language, editor, suggestions_count, acceptances_count, lines_suggested, lines_accepted, active_users 
                FROM BreakdownData 
                WHERE type = ? AND scope_name = ? AND team = ?`;

            const [metricsRows] = await this.dbConnection!.execute(metricsQuery, [this.type, this.scope_name,this.team]);
            const [breakdownRows] = await this.dbConnection!.execute(breakdownQuery, [this.type, this.scope_name,this.team]);

            const breakdownMap = new Map<string, BreakdownData[]>();
            for (const row of breakdownRows as any[]) {
                const key = `${row.day}`;
                if (!breakdownMap.has(key)) {
                    breakdownMap.set(key, []);
                }
                breakdownMap.get(key)!.push(new BreakdownData(row));
            }

            return (metricsRows as any[]).map((row: any) => new Metrics({
                ...row,
                breakdown: breakdownMap.get(`${row.day}`) || []
            }));
        } catch (error) {
            console.error('Error reading Metrics data from MySQL:', error);
            return [];
        }
    }

    public async queryMetrics(since?: string, until?: string, page: number = 1, per_page: number = 28): Promise<CopilotMetrics[]> {
        await this.ensureInitialized();
        console.log('team in queryMetricsData:', this.team);
        try {
            let query = `
                SELECT DATE_FORMAT(day, '%Y-%m-%d') as day, total_suggestions_count, total_acceptances_count, total_lines_suggested, total_lines_accepted, total_active_users, total_chat_acceptances, total_chat_turns, total_active_chat_users 
                FROM Metrics 
                WHERE type = ? AND scope_name = ? AND  team = ?`;

            const params: any[] = [this.type, this.scope_name,this.team];

            if (since) {
                query += ' AND day >= ?';
                params.push(since);
            }

            if (until) {
                query += ' AND day <= ?';
                params.push(until);
            }

            // query += ' LIMIT ? OFFSET ?';
            // params.push(per_page, (page - 1) * per_page);

            console.log('query:', query);
            console.log('params:', params);

            const [rows] = await this.dbConnection!.execute(query, params);
            const metrics = (rows as any[]).map((row: any) => new Metrics({
                ...row,
                breakdown: []
            }));

            for (const metric of metrics) {
                const breakdownQuery = `
                    SELECT DATE_FORMAT(day, '%Y-%m-%d') as day, language, editor, suggestions_count, acceptances_count, lines_suggested, lines_accepted, active_users 
                    FROM BreakdownData 
                    WHERE day = ? AND type = ? AND scope_name = ? AND team = ?`;
                const [breakdownRows] = await this.dbConnection!.execute(breakdownQuery, [metric.day, this.type, this.scope_name, this.team]);
                metric.breakdown = (breakdownRows as any[]).map((row: any) => new BreakdownData(row));
            }

            return metrics;
        } catch (error) {
            console.error('Error querying Metrics data from MySQL:', error);
            return [];
        }
    }
}