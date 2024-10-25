import organizationMockedResponse from '../assets/organization_response_sample.json';
import enterpriseMockedResponse from '../assets/enterprise_response_sample.json';
import axios from 'axios';
import { Metrics } from '../model/Metrics'; // Assuming Metrics is a class

export const getMetricsApi = async (
  scopeType: string,
  scopeName: string,
  token: string,
  team: string = ''
): Promise<Metrics[]> => {
  // Check the input parameters
  if (!["organization", "enterprise"].includes(scopeType)) {
    throw new Error("Invalid scope type");
  }
  if (!token) {
    throw new Error("Token is required");
  }
  if (!scopeName) {
    throw new Error("Scope name is required");
  }

  // Generate the API URL based on the scope type
  const apiUrl = scopeType === 'organization'
    ? `https://api.github.com/orgs/${scopeName}/copilot/usage`
    : `https://api.github.com/enterprises/${scopeName}/copilot/usage`;

  // Make the API request
  const response = await axios.get(
    apiUrl,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );
  //console.log('get metrics api for ${scopename} called in githubapi.ts at ', new Date());
  //for the console log, it neeeds to include the scopeName and the current date and time
  console.log(`get metrics api for ${scopeName} called in githubapi.ts at ${new Date()}`);


  // Map the response data to Metrics instances
  const metricsData = response.data.map((item: any) => new Metrics(item));
  return metricsData;
};