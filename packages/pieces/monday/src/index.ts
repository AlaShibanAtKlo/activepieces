import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createColumnAction } from './lib/actions/create-column';
import { createGroupAction } from './lib/actions/create-group';
import { createItemAction } from './lib/actions/create-item';
import { createUpdateAction } from './lib/actions/create-update';
import { updateColumnValuesOfItemAction } from './lib/actions/update-column-values-of-item';
import { updateItemNameAction } from './lib/actions/update-item-name';

const markdown = `
1.Log into your monday.com account.\n
2.Click on your avatar/profile picture in the top right corner.\n
3.Select **Administration** (this requires you to have admin permissions).\n
4.Go to the **API** section.\n
5.Copy your personal token`;

export const mondayAuth = PieceAuth.SecretText({
  displayName: 'API v2 Token',
  description: markdown,
  required: true,
});

export const monday = createPiece({
  displayName: 'monday.com',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/monday.png',
  authors: ['kanarelo', 'kishanprmr'],
  auth: mondayAuth,
  actions: [
    createColumnAction,
    createGroupAction,
    createItemAction,
    createUpdateAction,
    updateColumnValuesOfItemAction,
    updateItemNameAction,
  ],
  triggers: [],
});
