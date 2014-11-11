
define([
    'jscache'
], function(Cache) {
    'use strict';

        // Object cache per workspace
    var KIND_TO_CACHE = {
            vertex: 'vertices',
            edge: 'edges'
        },
        workspaceCaches = {},

        // Need all vertices in current workspace somehow
        workspaceVertices = {},

        api = {

            getObject: function(workspaceId, kind, objectId) {
                var result = api.getObjects(workspaceId, kind, [objectId]);
                return result.length ? result[0] : null;
            },

            getObjects: function(workspaceId, kind, objectIds) {
                if (!(kind in KIND_TO_CACHE)) {
                    throw new Error('kind parameter not valid', kind);
                }

                var workspaceCache = cacheForWorkspace(workspaceId, { create: false }),
                    cache = workspaceCache && workspaceCache[KIND_TO_CACHE[kind]];

                return objectIds.map(function(oId) {
                    return cache && cache.getItem(oId);
                })
            },

            setVerticesInWorkspace: function(workspaceId, vertexIds) {
                var workspaceCache = cacheForWorkspace(workspaceId);
                workspaceCache.onGraphVertexIds = _.indexBy(vertexIds);
            },

            checkAjaxForPossibleCaching: function(xhr, json, workspaceId, request) {
                if (resemblesVertices(json.vertices)) {
                    cacheVertices(workspaceId, json.vertices);
                }
            }
        };

    return api;

    function cacheForWorkspace(workspaceId, options) {
        if (workspaceId in workspaceCaches) {
            return workspaceCaches[workspaceId];
        }

        if (options && options.create === false) {
            return null;
        }

        workspaceCaches[workspaceId] = {
            vertices: new Cache(),
            edges: new Cache(),
            onGraphVertexIds: {}
        };

        return workspaceCaches[workspaceId];
    }

    function cacheVertices(workspaceId, vertices) {
        var vertexCache = cacheForWorkspace(workspaceId).vertices,
            updated = _.compact(vertices.map(function(v) {

                // Search puts a score, but we don't use it and it breaks
                // our cache update check
                if ('score' in v) {
                    delete v.score;
                }

                var previous = vertexCache.getItem(v.id);
                if (previous && _.isEqual(v, previous)) {
                    return;
                }

                console.debug('Cache ', v.id, workspaceId)
                vertexCache.setItem(v.id, v, {
                    expirationAbsolute: null,
                    expirationSliding: null,
                    priority: Cache.Priority.HIGH,
                    callback: function(k, v) {
                        console.debug('removed ' + k);
                    }
                });

                if (previous) {
                    console.debug('Vertex updated previous:', previous, 'new:', v)
                    return v;
                }
            }));

        if (updated.length && workspaceId === publicData.currentWorkspaceId) {
            // TODO: somehow also update vertices from other workspaces?
            console.log('updated', updated)
            dispatchMain('storeObjectsUpdated', { vertices: updated });
        }

        console.log(vertexCache)
    }

    function resemblesEdges(val) {
    }

    function resemblesVertices(val) {
        return val && val.length && val[0].id && val[0].properties;
    }
});
