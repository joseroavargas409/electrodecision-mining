param([Parameter(Mandatory=$true)][string]$OutputDirectory)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$plan = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot '../../docs/submission/media/SCENES_EN.json') | ConvertFrom-Json
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $speaker.SelectVoice('Microsoft Zira Desktop')
  $speaker.Rate = 1
  for ($sceneNumber = 0; $sceneNumber -lt $plan.Count; $sceneNumber++) {
    $sentenceNumber = 0
    foreach ($sentence in $plan[$sceneNumber].sentences) {
      $path = Join-Path $OutputDirectory ('scene-{0:00}-sentence-{1:00}.wav' -f $sceneNumber,$sentenceNumber)
      $speaker.SetOutputToWaveFile($path)
      $speaker.Speak([string]$sentence)
      $speaker.SetOutputToNull()
      $sentenceNumber++
    }
  }
} finally { $speaker.Dispose() }
Write-Output 'English narration rendered with the installed Microsoft Zira voice.'
