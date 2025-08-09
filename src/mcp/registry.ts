import { trelloMcpServer } from './server.js';

// Board tools
import {
  listBoardsSchema,
  getBoardSchema,
  createBoardSchema,
  updateBoardSchema,
  closeBoardSchema,
  reopenBoardSchema,
  deleteBoardSchema,
  listBoards,
  getBoard,
  createBoard,
  updateBoard,
  closeBoard,
  reopenBoard,
  deleteBoard,
} from './tools/boards.js';

// Board resources
import { readBoardResource } from './resources/board.js';

export function registerAllToolsAndResources() {
  // ===== BOARD TOOLS =====
  
  trelloMcpServer.registerTool(
    'list_boards',
    'List all boards accessible to the authenticated user',
    listBoardsSchema,
    listBoards
  );
  
  trelloMcpServer.registerTool(
    'get_board',
    'Get detailed information about a specific board',
    getBoardSchema,
    getBoard
  );
  
  trelloMcpServer.registerTool(
    'create_board',
    'Create a new Trello board',
    createBoardSchema,
    createBoard
  );
  
  trelloMcpServer.registerTool(
    'update_board',
    'Update an existing board\'s properties',
    updateBoardSchema,
    updateBoard
  );
  
  trelloMcpServer.registerTool(
    'close_board',
    'Close a board (archive it)',
    closeBoardSchema,
    closeBoard
  );
  
  trelloMcpServer.registerTool(
    'reopen_board',
    'Reopen a closed board',
    reopenBoardSchema,
    reopenBoard
  );
  
  trelloMcpServer.registerTool(
    'delete_board',
    'Permanently delete a board (cannot be undone)',
    deleteBoardSchema,
    deleteBoard
  );
  
  // ===== BOARD RESOURCES =====
  
  trelloMcpServer.registerResource(
    'trello:board/{id}',
    'Board Details',
    'Get comprehensive information about a Trello board including lists, cards, members, and labels',
    'application/json',
    readBoardResource
  );
}
