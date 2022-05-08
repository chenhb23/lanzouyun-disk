import {Application} from '../application'

export interface Extension {
  install(instance: Application): void
  // uninstall(instance: Application): void
}
