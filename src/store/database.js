import { Database } from '@vuex-orm/core'

import Tile from '@/models/Tile'
import Entity from '@/models/Entity'

// import TileModule from '@/modules/TileModule'

const database = new Database()

database.register(Tile, {})
database.register(Entity, {})

export default database
