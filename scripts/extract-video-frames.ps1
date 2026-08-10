$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$videoFolder = Join-Path $root 'assets\Videos'
$mobileVideo = Get-ChildItem -LiteralPath $videoFolder -Filter 'Landing Daring M*.mp4' | Select-Object -First 1
if (-not $mobileVideo) { throw 'No se encontró el video móvil en assets\Videos' }
$videos = @(
  @{ Input = Join-Path $root 'assets\Videos\Landing Daring web2.mp4'; Output = Join-Path $root 'assets\video-frames\desktop' },
  @{ Input = $mobileVideo.FullName; Output = Join-Path $root 'assets\video-frames\mobile' }
)

foreach ($video in $videos) {
  if (-not (Test-Path -LiteralPath $video.Input)) { throw "Video no encontrado: $($video.Input)" }
  if (Test-Path -LiteralPath $video.Output) { Remove-Item -LiteralPath $video.Output -Recurse -Force }
  New-Item -ItemType Directory -Path $video.Output -Force | Out-Null
  & ffmpeg -hide_banner -loglevel error -i $video.Input -vf "fps=30" -c:v libwebp -lossless 1 -compression_level 6 (Join-Path $video.Output 'frame-%04d.webp')
  if ($LASTEXITCODE -ne 0) { throw "ffmpeg falló para $($video.Input)" }
}
