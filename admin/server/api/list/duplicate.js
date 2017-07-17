function duplicate(listName, query, keystone, user, parent) {
  return new Promise(function(resolve, reject) {
    var list = keystone.list(listName);
    list.model.find(query, function (error, items) {
      if (error) {
        reject(error);
      } else {
        if (!items) resolve();
        let itemPromises = [];
        items.forEach(function(item) {
          itemPromises.push(new Promise(function(_resolve, _reject) {
            var duplicated = new list.model();
            if (item.name) {
              item.name = item.name + " duplicate";
            }
            if (item.slug) {
              item.slug = item.slug + "-duplicate";
            }
            if (item.uuid) {
              item.uuid = null;
            }
            if (item.isMonetized) {
              item.isMonetized = false;
            }
            if (parent) {
              item[parent.name] = parent.id
            }
            list.updateItem(duplicated, item, {
              ignoreNoEdit: true,
              user: user,
            }, function (error) {
              if (error) {
                _reject(error);
              } else {
                let obj = list.getData(duplicated);

                let relPromises = [];
                Object.values(list.relationships).forEach(function (rel) {
                  let parent = {
                    name: rel.refPath,
                    id: obj.id
                  }
                  relPromises.push(duplicate(rel.ref, {[rel.refPath]: item.id}, keystone, user, parent))
                });

                Promise.all(relPromises).then(function(result) {
                  _resolve(obj);
                }).catch(function(error) {
                  _reject(error);
                });
              }
            });
          }));
        });
        Promise.all(itemPromises).then(function(object) {
          resolve(object[0]);
        }).catch((function(error) {
          reject(error);
        }));
      }
    });
  });
}

module.exports = function (req, res) {
  var keystone = req.keystone;
  if (!keystone.security.csrf.validate(req)) {
    return res.apiError(403, 'invalid csrf');
  }

  duplicate(req.list.model.modelName, {'_id': req.params.id}, req.keystone, req.user, null).then(function(result) {
    res.json(result);
  }).catch(function(error) {
    var status = error.error === 'validation errors' ? 400 : 500;
    var error = error.error === 'database error' ? error.detail : error;
    res.apiError(status, error);
  });
};
