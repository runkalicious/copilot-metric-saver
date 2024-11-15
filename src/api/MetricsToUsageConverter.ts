import fs from 'fs';
import path from 'path';
import { CopilotUsage, CopilotUsageBreakdown } from './../model/Copilot_Usage';
import { CopilotMetrics } from './../model/copilot_metrics';




export class MetricsToUsageConverter {
  public static async convertMetricsToUsage(metricsFilePath: string, usageFilePath: string): Promise<void> {
    try {
      const metricsData = JSON.parse(fs.readFileSync(metricsFilePath, 'utf-8')) as CopilotMetrics[];
      const usageData: CopilotUsage[] = metricsData.map(metric => {
        const breakdown: CopilotUsageBreakdown[] = [];

        metric.copilot_ide_code_completions?.editors.forEach(editor => {
          editor.models.forEach(model => {
            model.languages.forEach(language => {
              breakdown.push(new CopilotUsageBreakdown({
                language: language.name,
                editor: editor.name,
                suggestions_count: language.total_code_suggestions,
                acceptances_count: language.total_code_acceptances,
                lines_suggested: language.total_code_lines_suggested,
                lines_accepted: language.total_code_lines_accepted,
                active_users: language.total_engaged_users
              }));
            });
          });
        });

        const totalChatInsertions = metric.copilot_ide_chat?.editors.reduce((sum, editor) => 
          sum + editor.models.reduce((sum, model) => sum + model.total_chat_insertion_events, 0), 0) || 0;

        const totalChatCopies = metric.copilot_ide_chat?.editors.reduce((sum, editor) => 
          sum + editor.models.reduce((sum, model) => sum + model.total_chat_copy_events, 0), 0) || 0;

        console.log(`Date: ${metric.date}`);
        console.log(`Total Chat Insertions: ${totalChatInsertions}`);
        console.log(`Total Chat Copies: ${totalChatCopies}`);

        return new CopilotUsage({
          day: metric.date,
          total_suggestions_count: breakdown.reduce((sum, item) => sum + item.suggestions_count, 0),
          total_acceptances_count: breakdown.reduce((sum, item) => sum + item.acceptances_count, 0),
          total_lines_suggested: breakdown.reduce((sum, item) => sum + item.lines_suggested, 0),
          total_lines_accepted: breakdown.reduce((sum, item) => sum + item.lines_accepted, 0),
          total_active_users: metric.total_active_users,
          total_chat_acceptances: totalChatInsertions + totalChatCopies,
          total_chat_turns: metric.copilot_ide_chat?.editors.reduce((sum, editor) => 
            sum + editor.models.reduce((sum, model) => sum + model.total_chats, 0), 0) || 0,
          total_active_chat_users: metric.copilot_ide_chat?.total_engaged_users || 0,
          breakdown: breakdown
        });
      });

      fs.writeFileSync(usageFilePath, JSON.stringify(usageData, null, 2));
      console.log(`Metrics data converted to usage format and saved to ${usageFilePath}`);
    } catch (error) {
      console.error('Error converting metrics to usage format:', error);
    }
  }
}

// Example usage
const metricsFilePath = path.join(__dirname, '../../data/organization_Copilotnext/team6_metrics.json');
const usageFilePath = path.join(__dirname, '../../data/organization_Copilotnext/team6_usage_convert2.json');
MetricsToUsageConverter.convertMetricsToUsage(metricsFilePath, usageFilePath);