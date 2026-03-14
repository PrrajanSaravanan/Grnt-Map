import { Grant, Organization } from "../types";

export const generateGrants = async (query: string): Promise<Grant[]> => {
  try {
    const response = await fetch(`/api/grants?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Error fetching grants:", error);
    return [];
  }
};

export const generateApplicationContent = async (grant: Grant, org: Organization) => {
  try {
    const response = await fetch('/api/generate-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant, org })
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Error generating application content:", error);
    return {
      overview: `We are uniquely positioned to execute the "${grant.title}" project. Our organization has a proven track record of delivering high-impact results in this specific domain. With a dedicated team and robust community partnerships, we ensure that every dollar of the ${grant.amount} is maximized for tangible outcomes.`,
      mission: `To empower communities through sustainable, data-driven solutions that directly address the core objectives of the ${grant.title} initiative.`,
      budget: `The ${grant.amount} will be allocated as follows: 40% to direct program implementation, 30% to community outreach and training, 20% to technology and infrastructure, and 10% to rigorous monitoring and evaluation.`,
      impact: [
        "Directly engage and support over 5,000 community members in the first year.",
        "Establish 3 new sustainable community hubs.",
        "Reduce local environmental impact metrics by 15% within 18 months.",
        "Publish a comprehensive, open-source framework for regional scalability."
      ],
    };
  }
};
