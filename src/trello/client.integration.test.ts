import { trelloClient } from './client.js';
import { TrelloLabel } from './types.js';

// This test suite requires Trello API credentials to be set in the environment.
// It will interact with the live Trello API.
describe('TrelloClient integration tests', () => {
  let testBoardId: string;
  const createdLabelIds: string[] = [];

  beforeAll(async () => {
    // In a real-world scenario, you would use a dedicated test board.
    // For this example, we'll fetch the user's boards and use the first one.
    const boards = await trelloClient.listBoards();
    if (!boards.length) {
      throw new Error('No Trello boards found for the provided credentials. Please create a board to run tests.');
    }
    testBoardId = boards[0].id;
  });

  afterAll(async () => {
    // Clean up created labels
    for (const labelId of createdLabelIds) {
      try {
        await trelloClient.deleteLabel(labelId);
      } catch (error) {
        console.error(`Failed to delete label ${labelId}:`, error);
      }
    }
  });

  it('should create a new label on a board', async () => {
    const labelName = `Test Label ${Date.now()}`;
    const labelColor = 'blue';

    const newLabel = await trelloClient.createLabel({
      idBoard: testBoardId,
      name: labelName,
      color: labelColor,
    });

    createdLabelIds.push(newLabel.id);

    expect(newLabel).toBeDefined();
    expect(newLabel.name).toBe(labelName);
    expect(newLabel.color).toBe(labelColor);
    expect(newLabel.idBoard).toBe(testBoardId);
  });
});