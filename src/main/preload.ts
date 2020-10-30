import * as fs from 'fs'
import * as http from 'https'
import FormData from 'form-data'
import electron from 'electron'

global.fs = fs
global.http = http
global.electron = electron
global.FormData = FormData
