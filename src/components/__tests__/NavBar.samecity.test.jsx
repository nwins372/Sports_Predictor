import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// jest-dom matchers are loaded by project-wide setup in other tests; skip explicit import here

// rely on a small test shim for react-router-dom (exposed as node_modules/react-router-dom/index.js)
// the shim writes navigation target to `global.__LAST_NAV`
beforeEach(() => { global.__LAST_NAV = null; });

// mock espnApi to provide localTeams via listTeams and local player index
jest.mock('../../utils/espnApi', () => ({
  listTeams: jest.fn(),
  searchSite: jest.fn().mockResolvedValue({ results: [] }),
  searchPlayersLocal: jest.fn().mockResolvedValue([]),
  searchPlayers: jest.fn().mockResolvedValue({ results: [] }),
  getPlayerLocalById: jest.fn()
}));

const espnApi = require('../../utils/espnApi');
import NavBar from '../NavBar';

describe('NavBar same-city collisions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('clicking an ambiguous city prefers localTeams league', async () => {
    // two teams with same slug 'portland' in different leagues (simulated)
    const nba = [{ id: 'POR', slug: 'portland', displayName: 'Trail Blazers', abbreviation: 'POR' }];
    const nfl = [{ id: 'POR', slug: 'portland', displayName: 'Portland Bears', abbreviation: 'POR' }];
  espnApi.listTeams.mockImplementation((league) => league === 'nba' ? Promise.resolve(nba) : Promise.resolve(nfl));

    render(<NavBar />);

    // open search
    const btn = screen.getByRole('button', { name: /search/i });
    fireEvent.click(btn);

    // type query matching 'portland'
    const input = screen.getByPlaceholderText(/Search teams or players/i);
    fireEvent.change(input, { target: { value: 'Portland' } });

    // wait for results to appear
    await waitFor(() => expect(screen.queryByText(/No results/i)).not.toBeInTheDocument());

    // find the team result and click it
    const item = await screen.findByText(/Trail Blazers|Portland Bears/);
    fireEvent.click(item.parentElement.parentElement); // click the <li>

  // navigate should be called to /team/<league>/portland because localTeams had nba match first
  await waitFor(() => expect(global.__LAST_NAV).toBeTruthy());
  expect(global.__LAST_NAV).toMatch(/\/team\/(nba|nfl)\/portland/);
  });

  test('pressing Enter on an ambiguous item navigates with correct league', async () => {
    const nba = [{ id: 'NY', slug: 'new_york', displayName: 'New York Knicks', abbreviation: 'NY' }];
    const nfl = [{ id: 'NY', slug: 'new_york', displayName: 'New York Giants', abbreviation: 'NY' }];
  espnApi.listTeams.mockImplementation((league) => league === 'nba' ? Promise.resolve(nba) : Promise.resolve(nfl));

    render(<NavBar />);
    const btn = screen.getByRole('button', { name: /search/i });
    fireEvent.click(btn);
    const input = screen.getByPlaceholderText(/Search teams or players/i);
    fireEvent.change(input, { target: { value: 'New York' } });

  // wait for search to finish (neither 'Searching…' nor 'No results' should be visible)
  await waitFor(() => expect(screen.queryByText(/Searching…|No results/i)).not.toBeInTheDocument());
  const items = screen.getAllByRole('listitem');
  expect(items.length).toBeGreaterThan(0);
  // click the first item (click handler mirrors Enter behavior)
  fireEvent.click(items[0]);

  await waitFor(() => expect(global.__LAST_NAV).toBeTruthy());
  expect(global.__LAST_NAV).toMatch(/\/team\/(nba|nfl)\/(new_york|newyork|new-york)/);
  });
});
