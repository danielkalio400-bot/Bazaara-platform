package app.bazaara.bazcut.share

import androidx.core.content.FileProvider

// A distinct manifest component keeps export paths separate from Tauri's provider.
class BazCutFileProvider : FileProvider()
