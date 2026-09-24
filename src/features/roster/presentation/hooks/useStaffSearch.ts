import { useQuery } from '@tanstack/react-query'
import { rosterRepository } from '../../data/rosterRepository'
import type { WardCode } from '../../domain/entities'

export function useStaffSearch(ward: WardCode, query: string) {
  return useQuery({
    queryKey: ['staff', ward, query],
    queryFn: ({ signal }) => rosterRepository.getStaff(ward, query, signal),
    enabled: query.trim().length >= 2,
    staleTime: 30_000
  })
}
