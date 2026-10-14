/**
 * WHICH COLLECTION PLAYS WHICH PART. [owner 2026-10-14] The engine knows four parts, and a site names the collection that plays each: the ARTICLE (a record that holds a brief and its pages, per
 * locale), the PAGE (a page of its own: About, Privacy), the CATEGORY and the TAG (the taxonomy an article is put in). They were the names `articles`, `pages`, `categories` and `tags` typed through the
 * CMS function, the build, the scripts and the CMS screen. They are `collectionRoles` in `site.config.json`, read here, so a site whose articles live in `guides` says so once.
 * A key the config leaves out takes the name it is given below.
 */
export const COLLECTION_ROLES = ['article', 'page', 'category', 'tag'];
export const DEFAULT_COLLECTION_ROLES = { article: 'articles', page: 'pages', category: 'categories', tag: 'tags' };

/** @returns {{ article: string, page: string, category: string, tag: string }}  the collection names, from a site config (or anything that carries `collectionRoles`) */
export const rolesOf = (cfg) => ({ ...DEFAULT_COLLECTION_ROLES, ...((cfg && cfg.collectionRoles) || {}) });

/** The name of a role that a `collections` list of a query may use in place of a collection name: `@article`. */
export const resolveRoleName = (name, cfg) => (typeof name === 'string' && name.startsWith('@') ? rolesOf(cfg)[name.slice(1)] || name : name);
