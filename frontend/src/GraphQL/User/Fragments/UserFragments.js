// defining the user fragment
import { gql } from "@apollo/client";
export const USER_FRAGMENT = gql`
  fragment UserFragment on User {
    id
    name
    email
    profileImage
    role
    created_at
    updated_at
  }
`;
