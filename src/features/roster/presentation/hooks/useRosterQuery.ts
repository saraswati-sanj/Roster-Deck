import { useQuery } from '@tanstack/react-query'
import { rosterRepository } from '../../data/rosterRepository'
import type { WardCode } from '../../domain/entities'

export function useRosterQuery(ward: WardCode, week: string) {
  return useQuery({
    queryKey: ['roster', ward, week],
    queryFn: () => rosterRepository.getRoster(ward, week),
    placeholderData: previous => previous
  })
}
