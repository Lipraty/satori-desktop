import { SQLiteDriver } from '@minatojs/driver-sqlite'

class SQLiteDatabase extends SQLiteDriver {
  static override name: string = 'driver-sqlite'
}

export default SQLiteDatabase
