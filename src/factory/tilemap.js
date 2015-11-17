const CONSTRAINT_MUST_EXIST = 1
const CONSTRAINT_MUST_NOT_EXIST = 2

function Tile(x, y, z, tileGroup) {
  return {
    x: x,
    y: y,
    z: z,
    tileGroup: tileGroup
  };
};

function Rule(otherTileGroup, vector, radius, constraint) {
  return {
    otherTileGroup: otherTileGroup,
    vector: vector,
    radius: radius,
    constraint: constraint
  };
};

function TileMap() {
  this.tileGroups = []; // array of type tile group
  this.level = []; // array of type Tile
}

TileMap.prototype.getLevelTileInstances = function() {
  self = this;
  var result = [];

  for (var levelTileId = 0; levelTileId < self.level.length; levelTileId++) {
    var levelTile = self.level[levelTileId];
    var success = true;
    var successTileType = null;

    // select tile group
    var tileGroup = null;
    for (var tileGroupId = 0; tileGroupId < self.tileGroups.length; tileGroupId++) {
      if (self.tileGroups[tileGroupId].tileGroupName == levelTile.tileGroup) {
        tileGroup = self.tileGroups[tileGroupId];
      }
    }

    if (!tileGroup) {
      console.log('tile group was not found, continuing')
      continue;
    }

    var tileType = null;
    // check every tile type in tile group
    for (var tileTypeId = 0; tileTypeId < tileGroup.tileTypes.length; tileTypeId++) {
      tileType = tileGroup.tileTypes[tileTypeId];

      var rule = null;
      var success = true;
      var successTileType = null;

      // check whether rules pass the test
      for (var ruleId = 0; ruleId < tileType.rules.length; ruleId++) {
        rule = tileType.rules[ruleId];

        var foundRequiredTile = false;
        for (var otherLevelTileId = 0; otherLevelTileId < self.level.length; otherLevelTileId++) {
          // skip self test
          if (otherLevelTileId === levelTileId) {
            continue;
          }

          // check if in range and equals other type
          var otherLevelTile = self.level[otherLevelTileId];
          var distance = Math.sqrt(
            ((levelTile.x + rule.vector.x) - otherLevelTile.x) * ((levelTile.x + rule.vector.x) - otherLevelTile.x) + ((levelTile.y + rule.vector.y) - otherLevelTile.y) * ((levelTile.y + rule.vector.y) - otherLevelTile.y) + ((levelTile.z + rule.vector.z) - otherLevelTile.z) * ((levelTile.z + rule.vector.z) - otherLevelTile.z)
          );
          if (otherLevelTile.tileGroup == rule.otherTileGroup && distance <= rule.radius) {
            foundRequiredTile = true;
          }
        }

        if ((rule.constraint == CONSTRAINT_MUST_EXIST && !foundRequiredTile) || (rule.constraint == CONSTRAINT_MUST_NOT_EXIST && foundRequiredTile)) {
          success = false;
        }
      }

      if (success) {
        result.push({
          tile: levelTileId,
          tileType: tileType.name
        });
      }
    }
  }

  return result;
}
