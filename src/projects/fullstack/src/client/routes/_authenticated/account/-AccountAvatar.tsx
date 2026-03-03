import type {ImageLoadingStatus} from '@/client/components/ui/avatar'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/client/components/ui/avatar'
import {Button} from '@/client/components/ui/button'
import {Input} from '@/client/components/ui/input'
import {Label} from '@/client/components/ui/label'
import {Separator} from '@/client/components/ui/separator'
import {logClientError} from '@/client/lib/utils'
import {apiAuthClientAtom, apiClientAtom} from '@/client/state/globalState'
import {authRoutePath, maxAvatarUploadSize} from '@/shared/constants'

import {bytesToSize} from '@qodestack/utils'
import {useMutation} from '@tanstack/react-query'
import {useRouteContext} from '@tanstack/react-router'
import {useAtomValue} from 'jotai'
import {useId, useMemo, useRef, useState} from 'react'
import {toast} from 'sonner'

export function AccountAvatar() {
  const user = useRouteContext({
    from: '/_authenticated',
    select: ({user}) => user,
  })
  const initials = useMemo(() => {
    const first = user.name.trim()[0] ?? ''
    const last = user.lastName?.trim?.()[0] ?? ''
    return `${first}${last}` || (user.name || 'U').slice(0, 2)
  }, [user.lastName, user.name])

  const [showImage, setShowImage] = useState(true)
  const [imageLoadingStatus, setImageLoadingStatus] =
    useState<ImageLoadingStatus>('idle')
  const [blobPreviewUrl, setBlobPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputId = useId()
  const apiClient = useAtomValue(apiClientAtom)
  const apiAuthClient = useAtomValue(apiAuthClientAtom)

  const clearPreview = () => {
    if (blobPreviewUrl) URL.revokeObjectURL(blobPreviewUrl)
    setBlobPreviewUrl(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const res = await apiAuthClient.avatar.$post({form: {avatar: file}})
      return res.json()
    },
    onSuccess: data => {
      if ('error' in data) {
        toast.error(data.error)
        logClientError({
          error: data,
          context: 'client:avatarUploadRejection',
          apiClient,
        })
        return
      }

      toast.success('Avatar updated')
      setShowImage(true)
      clearPreview()
    },
    onError: error => {
      toast.error(error.message)
      logClientError({
        error,
        context: 'client:avatarUploadException',
        apiClient,
      })
      setShowImage(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiAuthClient.avatar.$delete()
      if (res.ok) return res

      return {
        error: 'Delete avatar failed',
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      }
    },
    onSuccess: data => {
      if (data && 'error' in data) {
        toast.error('Failed to remove avatar')
        logClientError({
          error: data,
          context: 'client:avatarDeleteRejection',
          apiClient,
        })
        setShowImage(true)
        return
      }

      toast.success('Avatar removed')
      setShowImage(false)
    },
    onError: error => {
      toast.error('Failed to remove avatar')
      logClientError({
        error,
        context: 'client:avatarDeleteException',
        apiClient,
      })
      setShowImage(true)
    },
  })

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 rounded-full">
          <AvatarImage
            src={
              blobPreviewUrl ??
              (showImage ? `${authRoutePath}/avatar` : undefined)
            }
            alt={user.email}
            onLoadingStatusChange={status => {
              if (!blobPreviewUrl) setImageLoadingStatus(status)
            }}
          />
          <AvatarFallback className="rounded-lg font-semibold uppercase">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="text-sm">
          <p className="font-medium">
            {user.name} {user.lastName}
          </p>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <Separator className="my-2" />

      <div className="space-y-2 text-sm">
        {imageLoadingStatus !== 'loaded' && !blobPreviewUrl && (
          <>
            <Label htmlFor={avatarInputId}>Avatar</Label>
            <Input
              ref={fileInputRef}
              id={avatarInputId}
              type="file"
              accept="image/*"
              className="cursor-pointer"
              disabled={uploadMutation.isPending}
              onChange={event => {
                const file = event.target.files?.[0]
                if (!file) return
                if (file.size > maxAvatarUploadSize) {
                  toast.warning(
                    `File too large (max ${bytesToSize(maxAvatarUploadSize)})`
                  )
                  event.target.value = ''
                  return
                }
                if (blobPreviewUrl) URL.revokeObjectURL(blobPreviewUrl)
                setBlobPreviewUrl(URL.createObjectURL(file))
                setSelectedFile(file)
              }}
            />
          </>
        )}
        <p className="text-muted-foreground text-xs">
          Images are resized to 128x128 and converted to WebP.
        </p>
        {uploadMutation.isPending && (
          <p className="text-muted-foreground text-xs">Uploading...</p>
        )}
        {blobPreviewUrl && (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={uploadMutation.isPending}
              onClick={() => {
                if (selectedFile) uploadMutation.mutate(selectedFile)
              }}
            >
              Upload avatar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadMutation.isPending}
              onClick={clearPreview}
            >
              Clear avatar
            </Button>
          </div>
        )}
        {imageLoadingStatus === 'loaded' && !blobPreviewUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            Remove avatar
          </Button>
        )}
      </div>
    </>
  )
}
