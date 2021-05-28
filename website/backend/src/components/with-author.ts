import {expose} from '@layr/component';
import {attribute} from '@layr/storable';
import {role} from '@layr/with-roles';

import type {Entity} from './entity';

export const WithAuthor = (Base: typeof Entity) => {
  class WithAuthor extends Base {
    ['constructor']!: typeof WithAuthor;

    @expose({get: true}) @attribute('User') author = this.constructor.User.authenticatedUser!;

    @role('author') async authorRoleResolver() {
      if (this.resolveRole('guest')) {
        return undefined;
      }

      if (this.isNew()) {
        return true;
      }

      await this.getGhost().load({author: {}});

      return this.getGhost().author === this.constructor.User.authenticatedUser!.getGhost();
    }
  }

  return WithAuthor;
};
