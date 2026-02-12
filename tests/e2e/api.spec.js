const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://192.168.27.30:8080';

test.describe('API Endpoints', () => {
  test('GET /api/gpu - GPU data endpoint', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/gpu`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('utilization');
    expect(data).toHaveProperty('memory');
  });

  test('GET /api/services - Services list', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/services`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.services) || Array.isArray(data)).toBe(true);
  });

  test('POST /api/tickets - Create ticket', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/tickets`, {
      data: {
        title: 'E2E Test Ticket',
        description: 'Automated test ticket',
        priority: 'high',
        status: 'backlog'
      }
    });
    expect(response.status()).toBe(201);
    
    const ticket = await response.json();
    expect(ticket).toHaveProperty('id');
    expect(ticket.title).toBe('E2E Test Ticket');
  });

  test('GET /api/tickets - List all tickets', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/tickets`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('tickets');
    expect(Array.isArray(data.tickets)).toBe(true);
    expect(data.total >= 0).toBe(true);
  });

  test('GET /api/tickets/:id - Get single ticket', async ({ request }) => {
    // First get a ticket ID
    const listResponse = await request.get(`${BASE_URL}/api/tickets`);
    const tickets = await listResponse.json();
    
    if (tickets.tickets.length > 0) {
      const ticketId = tickets.tickets[0].id;
      const response = await request.get(`${BASE_URL}/api/tickets/${ticketId}`);
      
      expect(response.status()).toBe(200);
      const ticket = await response.json();
      expect(ticket.id).toBe(ticketId);
    }
  });

  test('PUT /api/tickets/:id - Update ticket', async ({ request }) => {
    // Get a ticket first
    const listResponse = await request.get(`${BASE_URL}/api/tickets`);
    const tickets = await listResponse.json();
    
    if (tickets.tickets.length > 0) {
      const ticketId = tickets.tickets[0].id;
      const response = await request.put(`${BASE_URL}/api/tickets/${ticketId}`, {
        data: {
          lane: 'inprogress',
          priority: 'medium'
        }
      });
      
      expect([200, 201]).toContain(response.status());
    }
  });

  test('POST /api/ideas - Create idea', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/ideas`, {
      data: {
        title: 'E2E Test Idea',
        description: 'Automated test idea',
        submittedBy: 'sandy',
        tags: ['test'],
        priority: 'high'
      }
    });
    expect(response.status()).toBe(201);
    
    const idea = await response.json();
    expect(idea).toHaveProperty('id');
    expect(idea.title).toBe('E2E Test Idea');
  });

  test('GET /api/ideas - List all ideas', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/ideas`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('ideas');
    expect(Array.isArray(data.ideas)).toBe(true);
  });

  test('GET /api/ideas/:id - Get single idea', async ({ request }) => {
    const listResponse = await request.get(`${BASE_URL}/api/ideas`);
    const data = await listResponse.json();
    
    if (data.ideas.length > 0) {
      const ideaId = data.ideas[0].id;
      const response = await request.get(`${BASE_URL}/api/ideas/${ideaId}`);
      
      expect(response.status()).toBe(200);
      const idea = await response.json();
      expect(idea.id).toBe(ideaId);
    }
  });

  test('PUT /api/ideas/:id - Update idea status', async ({ request }) => {
    const listResponse = await request.get(`${BASE_URL}/api/ideas`);
    const data = await listResponse.json();
    
    if (data.ideas.length > 0) {
      const ideaId = data.ideas[0].id;
      const response = await request.put(`${BASE_URL}/api/ideas/${ideaId}`, {
        data: {
          title: data.ideas[0].title,
          status: 'approved'
        }
      });
      
      expect([200, 201]).toContain(response.status());
    }
  });

  test('POST /api/ideas/:id/convert - Convert idea to ticket', async ({ request }) => {
    // Create an idea first
    const createResponse = await request.post(`${BASE_URL}/api/ideas`, {
      data: {
        title: 'Convert Test Idea',
        description: 'This will be converted to a ticket',
        submittedBy: 'sandy'
      }
    });
    
    const idea = await createResponse.json();
    const ideaId = idea.id;
    
    // Convert it
    const convertResponse = await request.post(`${BASE_URL}/api/ideas/${ideaId}/convert`, {
      data: {
        title: 'Convert Test Idea'
      }
    });
    
    expect([200, 201]).toContain(convertResponse.status());
  });

  test('GET /api/ideas?status=proposed - Filter by status', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/ideas?status=proposed`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data.ideas)).toBe(true);
  });

  test('Error handling - 404 for non-existent ticket', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/tickets/NONEXISTENT`);
    expect([404, 400]).toContain(response.status());
  });

  test('Error handling - 404 for non-existent idea', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/ideas/IDEA-99999`);
    expect([404, 400]).toContain(response.status());
  });

  test('Validation - POST ticket without title', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/tickets`, {
      data: {
        description: 'No title provided'
      }
    });
    expect([400, 422]).toContain(response.status());
  });

  test('Validation - POST idea without title', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/ideas`, {
      data: {
        description: 'No title provided'
      }
    });
    expect([400, 422]).toContain(response.status());
  });
});
